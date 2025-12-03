import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

// =========================
//  INIT CLIENTS
// =========================

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX).namespace("ventas");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004"   // ✔ 768 dims
});

const llmModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

const parserModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

// =========================
//   ⚠ FECHA → NÚMERO
// =========================

function dateToNumber(dateStr) {
  // Convierte "2024-01-15" → 20240115
  return Number(dateStr.replace(/-/g, ""));
}

// =========================
// GENERAR EMBEDDING
// =========================

async function generateEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent(text);

    const vector = result.embedding?.values;

    if (!vector || vector.length !== 768) {
      console.error("Embedding inválido. Dimensión:", vector?.length);
      throw new Error("El embedding no tiene la dimensión 768 requerida.");
    }

    return vector;
  } catch (err) {
    console.error("Error generando embedding:", err);
    throw err;
  }
}


// =========================
// PARSEAR LA PREGUNTA
// =========================

async function parseQuery(query) {
  const prompt = `
Eres un modelo experto en interpretar consultas de ventas.
Devuelve SOLO un JSON válido con esta estructura exacta:

{
  "operation": "top_sold" | "recommend" | "best_year" | "top_revenue",
  "year": number | null,
  "from": "YYYY-MM-DD" | null,
  "to": "YYYY-MM-DD" | null
}

Pregunta:
"${query}"
`;

  const response = await parserModel.generateContent(prompt);
  const raw = response.response.text().trim();

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Error parseando JSON:", raw);
    parsed = {
      operation: "top_sold",
      year: null,
      from: null,
      to: null
    };
  }

  // 🔥 FIX: Extraer año aunque el JSON no lo devuelva
  if (!parsed.year) {
    const yearMatch = query.match(/20\d{2}/);
    if (yearMatch) parsed.year = Number(yearMatch[0]);
  }

  return parsed;
}

// =========================
// CREAR FILTRO PINECONE
// =========================

function buildFilter(parsed) {
  const filter = {};

  // Año completo → convertir a número
  if (parsed.year && !parsed.from && !parsed.to) {
    filter.Fecha = {
      $gte: dateToNumber(`${parsed.year}-01-01`),
      $lte: dateToNumber(`${parsed.year}-12-31`)
    };
  }

  // Rango → convertir a número
  if (parsed.from && parsed.to) {
    filter.Fecha = {
      $gte: dateToNumber(parsed.from),
      $lte: dateToNumber(parsed.to)
    };
  }

  // Fallback para consultas sin fecha
  if (!filter.Fecha) {
    filter.Fecha = { $exists: true };
  }

  return filter;
}

// =========================
//     RAG PRINCIPAL
// =========================

export async function askSalesRAG(query) {
  try {
    // 1. Interpretación
    const parsed = await parseQuery(query);
    console.log("Parsed Query:", parsed);

    // 2. Embedding
    const queryEmbedding = await generateEmbedding(query);

    // 3. Filtro
    const filter = buildFilter(parsed);
    console.log("Filtro Final:", filter);

    // 4. Consulta a Pinecone
    const pineconeRes = await index.query({
      vector: queryEmbedding,
      topK: 50,
      includeMetadata: true,
      filter,
    });

    const matches = pineconeRes.matches || [];
    console.log("Pinecone Response:", JSON.stringify(pineconeRes, null, 2));

    // 5. Contexto para análisis
    const context = matches.map(m => JSON.stringify(m.metadata)).join("\n");

    const prompt = `
Eres una IA experta en análisis de ventas.
Usa SOLO los datos del contexto. No inventes nada.

=== OPERACIÓN SOLICITADA ===
${JSON.stringify(parsed, null, 2)}

=== CONTEXTO ===
${context}

=== PREGUNTA ===
${query}

Responde únicamente usando los datos disponibles.
`;

    const response = await llmModel.generateContent(prompt);
    let text = response.response.text().trim();

    // 🔥 FIX: si devolvió JSON, extraer answer
    if (text.startsWith("{")) {
      try {
        const inside = JSON.parse(text);
        if (inside.answer) text = inside.answer;
      } catch (_) {}
    }

    return { answer: text };

  } catch (err) {
    console.error("Error en askSalesRAG:", err);
    return { error: "Hubo un error procesando la consulta." };
  }
}
