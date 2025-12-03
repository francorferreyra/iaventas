// syncPinecone.js
import { Pinecone } from "@pinecone-database/pinecone";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Sale from "../models/SaleModel.js";

dotenv.config();

// =======================================
// CONFIG
// =======================================
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

const INDEX_NAME = "nodegeminis";
const NAMESPACE = "ventas";

const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2500;

// =======================================
// MongoDB
// =======================================
async function connectMongo() {
  console.log("🔌 Conectando a MongoDB...");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("✔ MongoDB conectado");
}

// =======================================
// Pinecone + Gemini
// =======================================
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(INDEX_NAME);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

// ***************************************
// Embeddings por lote (MÁS VELOZ)
// ***************************************
async function embedBatch(texts) {
  const concurrency = 20; // cuántas requests paralelas
  const results = [];

  for (let i = 0; i < texts.length; i += concurrency) {
    const slice = texts.slice(i, i + concurrency);

    const embeddings = await Promise.all(
      slice.map(async (txt) => {
        const r = await embeddingModel.embedContent(txt);
        return r.embedding.values;
      })
    );

    results.push(...embeddings);
  }

  return results;
}
// Delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =======================================
// Procesar un batch
// =======================================
async function processBatch(batchDocs, batchNumber, processed) {
  console.log(`\n🚀 Batch ${batchNumber} | Procesados hasta ahora: ${processed}`);

  // ------------------------------------
  // Preparar textos
  // ------------------------------------
  const texts = batchDocs.map((sale) => {
    const fechaISO = sale.Fecha
      ? new Date(sale.Fecha).toISOString().split("T")[0]
      : "Fecha no disponible";

    const nombre = sale.Nombre || "Nombre no disponible";
    const cuit = sale.CUIT || "CUIT no disponible";
    const cantidad = sale.Cantidad ?? "Cantidad no disponible";
    const articulo = sale.Articulo || "Artículo no disponible";
    const nombreArticulo = sale.NombreArticulo || "Nombre Artículo no disponible";
    const total = sale.Total ?? "Total no disponible";

    return `${nombre} (CUIT ${cuit}) compró ${cantidad} unidades del artículo ${articulo} - ${nombreArticulo} el ${fechaISO}. Total: ${total}`;
  });

  // ------------------------------------
  // Embeddings por lote
  // ------------------------------------
  const embeddings = await embedBatch(texts);

  // ------------------------------------
  // Preparar records
  // ------------------------------------
  const records = batchDocs.map((sale, i) => {
    const fechaISO = sale.Fecha
      ? new Date(sale.Fecha).toISOString().split("T")[0]
      : null;

    // ID ÚNICO REAL → evita duplicados siempre
    const id = sale._id.toString();

    const structuredData = {
      idVenta: id,
      fecha: fechaISO,
      year: sale.Fecha ? new Date(sale.Fecha).getFullYear() : null,
      cliente: sale.Cliente,
      nombreCliente: sale.Nombre,
      cuit: sale.CUIT,
      articulo: sale.Articulo,
      nombreArticulo: sale.NombreArticulo,
      descripcionAdicional: sale.Desc_Adicional,
      cantidad: sale.Cantidad,
      precioUnitario: sale.P_Unit,
      total: sale.Total,
      localidad: sale.Localidad,
      provincia: sale["Nombre Provincia"],
    };

    return {
      id,
      values: embeddings[i],
      metadata: {
        text: texts[i],
        structured: JSON.stringify(structuredData),
      },
    };
  });

  // ------------------------------------
  // Enviar a Pinecone
  // ------------------------------------
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 Subiendo batch ${batchNumber} (intento ${attempt})...`);

     await index.upsert(
  records.map((r) => ({
    id: r.id,
    values: r.values,
    metadata: r.metadata,
  })),
  { namespace: NAMESPACE }
);

      console.log(`✅ Batch ${batchNumber} subido correctamente`);
      return;
    } catch (err) {
      console.warn(`⚠ Error batch ${batchNumber} (intento ${attempt}):`, err.message);

      if (attempt === MAX_RETRIES) {
        console.error(`❌ Falló batch ${batchNumber} después de ${MAX_RETRIES} intentos`);
      } else {
        console.log(`⏳ Reintentando en ${RETRY_DELAY_MS}ms...`);
        await delay(RETRY_DELAY_MS);
      }
    }
  }
}

// =======================================
// MAIN
// =======================================
async function run() {
  await connectMongo();

  const total = await Sale.countDocuments();
  console.log(`📄 Total de ventas encontradas: ${total}`);

  const cursor = Sale.find().lean().cursor();
  let batch = [];
  let processed = 0;
  let batchNumber = 1;

  for await (const sale of cursor) {
    batch.push(sale);

    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch, batchNumber, processed);
      processed += batch.length;
      batch = [];
      batchNumber++;
    }
  }

  // Último batch incompleto
  if (batch.length > 0) {
    await processBatch(batch, batchNumber, processed);
  }

  console.log("\n🎉 Sincronización completa con Pinecone");
  process.exit(0);
}

// =======================================
run().catch(err => {
  console.error("❌ Error general:", err);
  process.exit(1);
});
