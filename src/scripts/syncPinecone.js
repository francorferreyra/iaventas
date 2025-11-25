// src/scripts/syncPinecone.js

import "dotenv/config";
import mongoose from "mongoose";
import Sales from "../models/SaleModel.js";

import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Embeddings de Gemini
const embedder = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GEMINI_API_KEY
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX);
const namespace = index.namespace("ventas");

function buildText(sale) {
  return `
    Cliente: ${sale.Cliente}
    Nombre: ${sale.Nombre}
    Artículo: ${sale.Articulo}
    Nombre Artículo: ${sale.NombreArticulo}
    Cantidad: ${sale.Cantidad}
    Precio Unitario: ${sale["P. Unit."]}
    Monto Total: ${sale.MontoTotal}
    Provincia: ${sale.Provincia}
    Fecha: ${sale.Fecha}
  `;
}

async function run() {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✔ MongoDB conectado");

    console.log("📦 Obteniendo ventas desde Mongo...");
    const sales = await Sales.find();
    console.log("📄 Total de documentos:", sales.length);
console.log(await Sales.findOne());
    const batchSize = 100;

    for (let i = 0; i < sales.length; i += batchSize) {
      const batch = sales.slice(i, i + batchSize);
      const batchNumber = Math.ceil(i / batchSize) + 1;

      console.log(`🚀 Procesando batch ${batchNumber}`);

      const vectors = await Promise.all(
        batch.map(async (sale) => {
          const text = buildText(sale);

          // 🔥 Generar embedding
          const embedding = await embedder.embedQuery(text);

          // 🧪 DIAGNÓSTICO: mostrar primeras posiciones del embedding
          console.log("Embedding sample:", embedding.slice(0, 5));

          return {
            id: String(sale._id),
            values: embedding,
            metadata: {
              Cliente: sale.Cliente,
              Nombre: sale.Nombre,
              Articulo: sale.Articulo,
              NombreArticulo: sale.NombreArticulo,
              Cantidad: sale.Cantidad,
              PrecioUnit: sale["P. Unit."],
              MontoTotal: sale.MontoTotal,
              Provincia: sale.Provincia,
              Fecha: sale.Fecha,
            }
          };
        })
      );

      await namespace.upsert(vectors);
    }

    console.log("🎉 Proceso completado — Datos enviados a Pinecone");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();
