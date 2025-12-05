import "dotenv/config";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import SalesModel from "../models/SaleModel.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelos CORRECTOS con tu SDK actual
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

// --- Clasificación de intención --- //
const needsRag = (query) => {
  const keywords = [
    "similar", "parecido", "alternativa",
    "sirve para", "compatibilidad", "recomendame"
  ];
  return keywords.some((k) => query.toLowerCase().includes(k));
};

const needsMongo = (query) => {
  const keywords = [
    "popular", "más vendido", "ventas", "facturación",
    "ranking", "top productos"
  ];
  return keywords.some((k) => query.toLowerCase().includes(k));
};

// --- MongoDB: Top productos --- //
async function getMongoContext() {
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
  return results.map((r) => `Producto: ${r._id} - Vendidas: ${r.totalVendidas}`).join("\n");
}

// --- Motor principal --- //
export async function askAI(query) {
  console.log("🧠 Pregunta:", query);

  try {
    let context = "";

    // Pinecone → cuando es búsqueda semántica
    if (needsRag(query)) {
      console.log("📌 Usando Pinecone (RAG)…");

      const embedResponse = await embedModel.embedContent({
        content: { parts: [{ text: query }] }
      });

      const queryEmbedding = embedResponse.embedding.values;

      const pineconeResult = await index.query({
        topK: 5,
        vector: queryEmbedding,
        includeMetadata: true
      });

      if (pineconeResult.matches?.length > 0) {
        context = pineconeResult.matches
          .map((m) => m.metadata?.text || "")
          .join("\n");
      }
    }

    // Mongo → cuando es ranking de ventas
    if (!context && needsMongo(query)) {
      console.log("📌 Usando MongoDB…");
      context = await getMongoContext();
    }

    const prompt = context
      ? `Datos relevantes del sistema:\n${context}\n---\nPregunta:\n${query}`
      : query;

    const completion = await chatModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return completion.response.text() || "No encontré respuesta.";

  } catch (err) {
    console.error("❌ Error en askAI:", err);
    return "Error procesando tu consulta.";
  }
}
