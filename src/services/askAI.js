import "dotenv/config";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelos
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

const needsRag = (query) => {
  const keywords = [
    "ventas", "vendido", "artículo", "producto",
    "Facturación", "top", "cuál fue", "más vendido",
    "2023", "2024", "2025"
  ];
  return keywords.some((k) => query.toLowerCase().includes(k));
};

export async function askAI(query) {
  console.log("🧠 Pregunta:", query);

  try {
    let context = "";

    if (needsRag(query)) {
      console.log("📌 Se requiere RAG → Buscando en Pinecone…");

      // 🔹 Embedding CORRECTO
      const embedResponse = await embedModel.embedContent({
        content: {
          parts: [{ text: query }]
        }
      });

      const queryEmbedding = embedResponse.embedding?.values;
      if (!queryEmbedding) {
        throw new Error("No se pudo obtener el embedding");
      }

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

      console.log("📄 Contexto recuperado:", context.length > 0);
    }

    const prompt = context
      ? `Aquí tienes datos históricos de ventas:\n${context}\n\nCon esto, responde: ${query}`
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
