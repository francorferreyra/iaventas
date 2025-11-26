// syncPinecone.js
import { Pinecone } from "@pinecone-database/pinecone";
import mongoose from "mongoose";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// ------------------------
//  CONFIGURACIÓN
// ------------------------
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = "ventas";

// Tamaño del batch para procesar ventas
const BATCH_SIZE = 100;

// ------------------------
// Conexión a MongoDB
// ------------------------
async function connectMongo() {
  console.log("🔌 Conectando a MongoDB...");

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("✔ MongoDB conectado");
}

// ------------------------
// Modelo MongoDB
// ------------------------
const VentasSchema = new mongoose.Schema({}, { strict: false });
const VentasModel = mongoose.model("ventas", VentasSchema);

// ------------------------
// Conexión Pinecone + OpenAI
// ------------------------
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// ------------------------
// Embeddings helper
// ------------------------
async function embedText(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
  });

  return response.data[0].embedding;
}

// ------------------------
// Procesar ventas y subirlas a Pinecone
// ------------------------
async function run() {
  await connectMongo();

  const index = pinecone.index(INDEX_NAME);

  console.log("📦 Obteniendo ventas desde Mongo...");

  const totalCount = await VentasModel.countDocuments();
  console.log(`📄 Total de documentos: ${totalCount}`);

  const cursor = VentasModel.find().lean().cursor();

  let batchDocs = [];
  let processed = 0;
  let batchNumber = 1;

  for await (const sale of cursor) {
    batchDocs.push(sale);

    if (batchDocs.length >= BATCH_SIZE) {
      await processBatch(batchDocs, index, batchNumber, processed);
      processed += batchDocs.length;
      batchDocs = [];
      batchNumber++;
    }
  }

  if (batchDocs.length > 0) {
    await processBatch(batchDocs, index, batchNumber, processed);
  }

  console.log("🎉 Sincronización completa");
  process.exit(0);
}

// ------------------------
// Procesar batch individual
// ------------------------
async function processBatch(batchDocs, index, batchNumber, processed) {
  console.log(`🚀 Procesando batch ${batchNumber} (${processed} procesados)`);

  const texts = batchDocs.map((sale) => {
    return `${sale.Cliente} compró ${sale.Cantidad} unidades de ${sale.NombreArticulo} (artículo ${sale.Articulo}) el ${sale.Fecha}`;
  });

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: texts,
  });

  const embeddings = embeddingResponse.data.map((e) => e.embedding);

  const salesBatch = batchDocs.map((sale, index) => {
    const id = `${sale.CUIT}-${sale.Articulo}-${sale.Fecha}`;

    // 📌 METADATA ESTRUCTURADA (clave para responder correctamente)
    const structuredMetadata = {
      idVenta: id,
      year: new Date(sale.Fecha).getFullYear(),
      fecha: sale.Fecha,
      comprobante: sale.Comprobante ?? "",
      cliente: sale.Cliente ?? "",
      nombreCliente: sale.Nombre ?? "",
      cuit: sale.CUIT ?? "",
      codigoArticulo: sale.Articulo ?? "",
      nombreArticulo: sale.NombreArticulo ?? "",
      descripcion: sale["Desc.Adicional"] ?? "",
      cantidad: Number(sale.Cantidad) || 0,
      precioUnitario: Number(sale["P. Unit."]) || 0,
      subtotal:
        (Number(sale.Cantidad) || 0) * (Number(sale["P. Unit."]) || 0),
    };

    return {
      id,
      values: embeddings[index],
      metadata: {
        text: texts[index],
        structured: structuredMetadata,
      },
    };
  });

  // Subir batch al índice
  await index.upsert(salesBatch);

  console.log(`📤 Batch ${batchNumber} subido correctamente`);
}

// ------------------------
// Iniciar script
// ------------------------
run().catch((err) => {
  console.error("❌ Error en la sincronización:", err);
  process.exit(1);
});
