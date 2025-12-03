import "dotenv/config";
import mongoose from "mongoose";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const Ventas = mongoose.model(
  "Sale",
  new mongoose.Schema({}, { strict: false }),
  "sales" // COLECCIÓN REAL
);

// ------------------------
// INIT GEMINI
// ------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const llm = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// ------------------------
// INIT PINECONE
// ------------------------
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX).namespace("__default__");

// ------------------------
// DETECTOR de tipo de consulta
// ------------------------
function shouldUseMongo(question) {
  const keywords = [
    "más vendido", "mas vendido", "top", "ranking",
    "total", "suma", "cantidad", "promedio",
    "ventas del", "ventas en", "periodo",
    "año", "mes", "desde", "hasta"
  ];

  return keywords.some(k => question.toLowerCase().includes(k));
}

// ------------------------
// EXTRACCIÓN de fechas si existen
// ------------------------
function extractDateRange(text) {
  const years = text.match(/20\d{2}/g);

  if (years && years.length === 1) {
    const year = parseInt(years[0]);
    return {
      start: new Date(`${year}-01-01`),
      end: new Date(`${year}-12-31`)
    };
  }

  if (years && years.length === 2) {
    return {
      start: new Date(`${years[0]}-01-01`),
      end: new Date(`${years[1]}-12-31`)
    };
  }

  return null;
}

// ------------------------
// CONSULTA MONGO INTELIGENTE
// ------------------------
async function mongoQuery(question) {
  const range = extractDateRange(question);
  const match = {};

  if (range) {
    match.Fecha = { $gte: range.start, $lte: range.end };
  }

  const result = await Ventas.aggregate([
    { $match: match },
    { $group: {
        _id: "$Articulo",
        nombreArticulo: { $first: "$NombreArticulo" },
        cantidadTotal: { $sum: "$Cantidad" },
        totalVendido: { $sum: "$Total" }
    }},
    { $sort: { cantidadTotal: -1 } },
    { $limit: 10 }
  ]);

  const prompt = `
El usuario preguntó: "${question}"

Resultados obtenidos desde MongoDB:
${JSON.stringify(result, null, 2)}

Genera una respuesta clara, explicativa y basada en datos exactos.
  `;

  const response = await llm.generateContent(prompt);
  return response.response.text();
}

// ------------------------
// CONSULTA RAG SEMÁNTICA
// ------------------------
async function ragQuery(question) {
  const embedding = await embedModel.embedContent(question);
  const vector = embedding.embedding.values;

  const results = await index.query({
    vector,
    topK: 15,
    includeMetadata: true
  });

  const context = results.matches
    .map(m => m.metadata?.text || "")
    .join("\n");

  const prompt = `
Pregunta del usuario:
"${question}"

Contexto obtenido desde Pinecone:
${context}

Analiza patrones, comportamientos, insights y relaciones no numéricas.
  `;

  const response = await llm.generateContent(prompt);
  return response.response.text();
}

// ------------------------
// FUNCIÓN PRINCIPAL
// ------------------------
export async function askAI(question) {
  if (shouldUseMongo(question)) {
    return mongoQuery(question);
  } else {
    return ragQuery(question);
  }
}
