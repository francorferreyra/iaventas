import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

// Inicializa Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Selecciona el índice + namespace
const index = pinecone
  .index(process.env.PINECONE_INDEX)
  .namespace("__default__");

async function inspect() {
  try {
    // Consulta con un vector vacío de 768 dimensiones (correcto)
    const res = await index.query({
      vector: Array(768).fill(0),  // ← CAMBIO PRINCIPAL
      topK: 5,
      includeMetadata: true
    });

    console.log(JSON.stringify(res, null, 2));
  } catch (error) {
    console.error("❌ Error ejecutando la inspección:", error);
  }
}

inspect();
