import "dotenv/config";
import mongoose from "mongoose";
import Sales from "../models/SaleModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

console.log("🚀 Iniciando proceso de embeddings...");

// ------------------------------
// 1. Conexión a MongoDB
// ------------------------------
await mongoose.connect("mongodb+srv://zuka-company:jw7v466zHbaeSBxD@cluster0.bbmpq.mongodb.net/marketingia");
console.log("📌 Conectado a MongoDB Atlas");

// ------------------------------
// 2. Inicializar Gemini
// ------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

// ------------------------------
// 3. Inicializar Pinecone
// ------------------------------
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

console.log("📌 Pinecone listo");

// ------------------------------
// Función para convertir venta → texto
// ------------------------------
function saleToText(s) {
  return `
Fecha: ${new Date(s.Fecha).toLocaleDateString()}
Cliente: ${s.Nombre} (ID: ${s.Cliente})
CUIT: ${s.CUIT}
Producto: ${s.NombreArticulo}
Cantidad: ${s.Cantidad}
Precio Unitario: ${s.P_Unit}
Total: ${s.Total}
Provincia: ${s["Nombre Provincia"]}
Localidad: ${s.Localidad}
Descripción Adicional: ${s.Desc_Adicional}
`.trim();
}

// ------------------------------
// Procesar documentos
// ------------------------------
const docs = await Sales.find();
console.log(`📄 Ventas a procesar: ${docs.length}`);

for (const doc of docs) {
  const text = saleToText(doc);

  try {
    // 1. Generar embedding
    const embedding = await model.embedContent(text);
    const vector = embedding.embedding.values;

    // 2. Insertar en Pinecone
    await index.upsert([
      {
        id: doc._id.toString(),
        values: vector,
        metadata: {
          cliente: doc.Nombre,
          articulo: doc.NombreArticulo,
          total: doc.Total,
          fecha: doc.Fecha,
          provincia: doc["Nombre Provincia"],
        },
      },
    ]);

    console.log(`✔ Insertado: ${doc._id}`);
  } catch (err) {
    console.log(`❌ Error con doc ${doc._id}:`, err.message);
  }
}

console.log("🎉 Proceso finalizado");
process.exit();
