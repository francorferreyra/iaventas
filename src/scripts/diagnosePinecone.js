import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX);

async function run() {
  console.log("🔎 Probando query en Pinecone...");

  const res = await index.namespace("ventas").query({
    topK: 5,
    vector: Array(768).fill(0.1), // vector dummy solo para probar
    includeMetadata: true,
    includeValues: true,
  });

  console.log("📌 Resultado Pinecone:");
  console.dir(res, { depth: null });
}

run();
