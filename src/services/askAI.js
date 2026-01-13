import "dotenv/config";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { getSaleModel } from "../models/index.js";

// ==========================
// 🔐 Inicialización IA
// ==========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Embeddings
const embedModel = genAI.getGenerativeModel({
  model: "text-embedding-004"
});

// Chat
const chatModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// ==========================
// 📦 Pinecone
// ==========================
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pc.index(process.env.PINECONE_INDEX);

// ==========================
// 🧠 Clasificación de intención
// ==========================
async function classifyIntent(query) {
  const result = await chatModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
Clasificá la intención de la pregunta en UNA sola palabra:

- rag → búsqueda semántica de productos o similitudes
- mongo → métricas, ventas, rankings, facturación
- general → conocimiento general

Pregunta:
"${query}"

Respondé SOLO con: rag | mongo | general
`
          }
        ]
      }
    ]
  });

  return result.response.text().trim().toLowerCase();
}

// ==========================
// 📊 MongoDB – Ranking de ventas
// ==========================
export async function getMongoContext() {
  const Sale = getSaleModel();
console.log("📦 Total ventas:", await Sale.countDocuments());
  const results = await Sale.aggregate([
    {
      $match: {
        NombreArticulo: { $exists: true, $ne: "" }
      }
    },
    {
      $addFields: {
        CantidadNum: { $toDouble: "$Cantidad" }
      }
    },
    {
      $group: {
        _id: "$NombreArticulo",
        totalVendidas: { $sum: "$CantidadNum" }
      }
    },
    { $sort: { totalVendidas: -1 } },
    { $limit: 5 }
  ]);

  console.log("📊 Resultados Mongo:", results);

  if (!results.length) return null;

  return results
    .map(
      (r, i) =>
        `[Ranking ${i + 1}]
Producto: ${r._id}
Unidades vendidas: ${r.totalVendidas}`
    )
    .join("\n");
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
      type: "producto"
    }
  });

  if (!pineconeResult.matches?.length) return null;

  return pineconeResult.matches
    .map(
      (m, i) => `
[Producto ${i + 1}]
Nombre: ${m.metadata?.name || "N/A"}
Categoría: ${m.metadata?.categoria || "N/A"}
Subcategoría: ${m.metadata?.subcategoria || "N/A"}
Descripción: ${m.metadata?.text || ""}
`
    )
    .join("\n");
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

    // 2️⃣ Obtener contexto
    if (intent === "mongo") {
      console.log("📊 Usando MongoDB (ventas)");
      context = await getMongoContext();
    }

    if (intent === "rag") {
      console.log("📦 Usando Pinecone (productos)");
      context = await getRagContext(query);
    }

    // 3️⃣ Fallback seguro
    if (!context) {
      return "No tengo datos suficientes para responder con precisión.";
    }

    // 4️⃣ Prompt final
    const prompt = `
Sos un analista comercial especializado en marketing y ventas.

Usá EXCLUSIVAMENTE la información provista para responder.
No inventes datos.

Contexto:
${context}

Pregunta:
${query}

Respondé de forma clara, concreta y con justificación comercial.
`;

    // 5️⃣ Generar respuesta
    const completion = await chatModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    return completion.response.text() || "No encontré una respuesta clara.";
  } catch (err) {
    console.error("❌ Error en askAI:", err);
    return "Error procesando tu consulta.";
  }
}
