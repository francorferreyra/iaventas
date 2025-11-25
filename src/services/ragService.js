import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX).namespace("ventas");

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo de embeddings (CORRECTO)
const embedModel = genAI.getGenerativeModel({
  model: "text-embedding-004"
});

// Modelo LLM (gemini-2.0-flash)
const llm = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

// ===== GENERAR EMBEDDING =====
async function generateEmbedding(text) {
  try {
    const result = await embedModel.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("Error generando embedding:", err);
    throw err;
  }
}

export async function askSalesRAG(query) {
  const queryEmbedding = await generateEmbedding(query);

  const pineconeRes = await index.query({
    vector: queryEmbedding,
    topK: 8,
    includeMetadata: true
  });

  const matches = pineconeRes.matches || [];

  const context = matches
    .map((m) => JSON.stringify(m.metadata, null, 2))
    .join("\n\n");

    console.log("Pinecone Response:", JSON.stringify(pineconeRes, null, 2));


  const prompt = `
Eres una IA especializada en análisis de ventas.
Responde SOLO usando este contexto (no inventes datos).

=== CONTEXTO ===
${context}

=== PREGUNTA ===
${query}
`;

  const response = await llm.generateContent(prompt);

  return response.response.text();
}

