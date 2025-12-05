import "dotenv/config";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import SalesModel from "../models/SaleModel.js"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelos
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

// Detecta si debe usar RAG (ventas históricas)
const needsRag = (query) => {
  const keywords = [
    "ventas", "vendido", "artículo", "producto",
    "Facturación", "top", "cuál fue", "más vendido",
    "2023", "2024", "2025"
  ];
  return keywords.some((k) => query.toLowerCase().includes(k));
};

// Detecta si debe usar MongoDB (stock / recomendaciones / catálogo)
const needsMongo = (query) => {
  const keywords = [
    "stock", "disponible", "catálogo", "lista de productos",
    "rubros", "categorías", "precios", "código",
    "inventario", "existencia",
    "recomendación", "qué productos vender", "popular"
  ];
  return keywords.some((k) => query.toLowerCase().includes(k));
};

// Consulta a MongoDB para recomendaciones o catálogo
async function getMongoContext(query) {
  const results = await SalesModel.aggregate([
    {
      $group: {
        _id: "$NombreArticulo",
        totalVendidas: { $sum: "$Cantidad" }
      }
    },
    { $sort: { totalVendidas: -1 } },
    { $limit: 5 }
  ]);

  if (!results.length) return "";

  return results
    .map(r => `Producto: ${r._id} - Vendidas: ${r.totalVendidas}`)
    .join("\n");
}

export async function askAI(query) {
  console.log("🧠 Pregunta:", query);

  try {
    let context = "";

    // 🔹 Decisión inteligente
    if (needsRag(query)) {
      console.log("📌 Se requiere RAG → Pinecone");
      
      const embedResponse = await embedModel.embedContent({
        content: { parts: [{ text: query }] }
      });

      const queryEmbedding = embedResponse.embedding?.values;
      if (!queryEmbedding) throw new Error("No se pudo obtener el embedding");

      const pineconeResult = await index.query({
        topK: 5,
        vector: queryEmbedding,
        includeMetadata: true
      });

      if (pineconeResult.matches.length > 0) {
        context = pineconeResult.matches
          .map(m => m.metadata?.text || "")
          .join("\n");
      }

    } else if (needsMongo(query)) {
      console.log("📌 Se requiere consulta a MongoDB…");
      context = await getMongoContext(query);
    }

    // 🔹 Construcción de prompt final
    const prompt = context
      ? `Datos relevantes del sistema:\n${context}\n\nResponde esta consulta del usuario:\n${query}`
      : query;

    const completion = await chatModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const responseText = completion.response.text() || "No encontré respuesta.";
    console.log("🤖 Respuesta generada OK");
    return responseText;

  } catch (error) {
    console.error("❌ Error en askAI:", error);
    return "Ocurrió un error procesando la consulta.";
  }
}
