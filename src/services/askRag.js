import dotenv from "dotenv";
dotenv.config();

import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --------------------------------------------------------
// 1. Inicialización
// --------------------------------------------------------
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index("nodegeminis").namespace("__default__");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --------------------------------------------------------
// 2. Función: obtener embedding del texto de la pregunta
// --------------------------------------------------------
async function getEmbedding(text) {
  const embedModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

// --------------------------------------------------------
// 3. Función RAG: buscar en Pinecone
// --------------------------------------------------------
async function searchPinecone(query) {
  const embedding = await getEmbedding(query);

  const result = await index.query({
    topK: 30,
    includeMetadata: true,
    vector: embedding,
  });

  return result.matches.map((m) => m.metadata.text);
}

// --------------------------------------------------------
// 4. IA: generar la respuesta completa
// --------------------------------------------------------
async function generateAnswer(query, context) {
  const prompt = `
Eres una IA experta en análisis de ventas industriales.
Debes analizar el contexto que viene de mi base de datos.

PREGUNTA DEL USUARIO:
"${query}"

INFORMACIÓN RELEVANTE DE MIS VENTAS (RAG):
${context.join("\n")}

RESPONDE:
- patrones de comportamiento
- relaciones entre productos
- tendencias generales
- insights sobre clientes
- anomalías
- sugerencias de acción
- explicaciones basadas en los datos

NO inventes datos nuevos, usa únicamente el contexto provisto.
`;

  const response = await model.generateContent(prompt);
  return response.response.text();
}

// --------------------------------------------------------
// 5. Ejecutar
// --------------------------------------------------------
const pregunta = process.argv.slice(2).join(" ");

if (!pregunta) {
  console.log('Usá: node askRag.js "Qué patrones ves en mis ventas?"');
  process.exit(0);
}

console.log("Buscando datos relevantes en Pinecone...");
searchPinecone(pregunta).then(async (context) => {
  console.log(`Resultados obtenidos: ${context.length}`);

  const respuesta = await generateAnswer(pregunta, context);

  console.log("\n🧠 RESPUESTA IA:\n");
  console.log(respuesta);
});
