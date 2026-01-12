import "dotenv/config";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import SalesModel from "../models/SaleModel.js";

// ==========================
// 🔐 Inicialización IA
// ==========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Embeddings
const embedModel = genAI.getGenerativeModel({
  model: "text-embedding-004"
});

// Chat (usá un modelo estable si podés)
const chatModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// ==========================
// 📦 Pinecone
// ==========================
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

// ==========================
// 🧠 Clasificación de intención
// ==========================
async function classifyIntent(query) {
  const result = await chatModel.generateContent({
    contents: [{
      role: "user",
      parts: [{
        text: `
Clasificá la intención de la pregunta en UNA sola palabra:

- rag → búsqueda semántica de productos o información
- mongo → métricas, ventas, rankings, facturación
- general → charla o conocimiento general

Pregunta:
"${query}"

Respondé SOLO con: rag | mongo | general
`
      }]
    }]
  });

  return result.response.text().trim().toLowerCase();
}

// ==========================
// 📊 MongoDB – Top productos
// ==========================
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

  if (!results.length) return null;

  return results.map((r, i) => `
[Ranking ${i + 1}]
Producto: ${r._id}
Unidades vendidas: ${r.totalVendidas}
`).join("\n");
}

// ==========================
// 🔍 Pinecone – RAG semántico
// ==========================
async function getRagContext(query) {
  const embedResponse = await embedModel.embedContent({
    content: { parts: [{ text: query }] }
  });

  const queryEmbedding = embedResponse.embedding.values;

  const pineconeResult = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    filter: {
      type: "producto" // 🔥 MUY importante
    }
  });

  if (!pineconeResult.matches?.length) return null;

  return pineconeResult.matches.map((m, i) => `
[Documento ${i + 1}]
Producto: ${m.metadata?.name || "N/A"}
Marca: ${m.metadata?.brand || "N/A"}
Descripción: ${m.metadata?.text || ""}
`).join("\n");
}

// ==========================
// 🧠 Motor principal
// ==========================
export async function askAI(query) {
  console.log("🧠 Pregunta:", query);

  try {
    // 1️⃣ Clasificar intención
    const intent = await classifyIntent(query);
    console.log("📌 Intención detectada:", intent);

    let context = null;

    // 2️⃣ Obtener contexto según intención
    if (intent === "rag") {
      console.log("📦 Usando Pinecone (RAG)");
      context = await getRagContext(query);
    }

    if (intent === "mongo") {
      console.log("📊 Usando MongoDB");
      context = await getMongoContext();
    }

    // 3️⃣ Fallback seguro
    if (!context) {
      return "No tengo datos suficientes para responder con precisión.";
    }

    // 4️⃣ Prompt RAG profesional
    const prompt = `
Sos un asistente del sistema interno de ventas.

REGLAS IMPORTANTES:
- Respondé SOLO con la información del contexto
- No inventes productos, cifras ni conclusiones
- No realices cálculos adicionales
- Si la información no alcanza, decilo claramente

CONTEXTO:
${context}

PREGUNTA:
${query}

RESPUESTA CLARA Y DIRECTA:
`;

    // 5️⃣ Generar respuesta
    const completion = await chatModel.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });

    return completion.response.text() || "No encontré una respuesta clara.";

  } catch (err) {
    console.error("❌ Error en askAI:", err);
    return "Error procesando tu consulta.";
  }
}
