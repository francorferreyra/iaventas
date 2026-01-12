import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

import "../db/mongo.connections.js";
import { getProductsForIndexing } from "../services/productAggregation.js";
import { indexProducts } from "../services/productIndexer.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function run() {
  const products = await getProductsForIndexing();
  console.log(`🔍 Productos encontrados: ${products.length}`);

  await indexProducts(products, embedModel);
  console.log("✅ Indexación completa");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error indexando:", err);
  process.exit(1);
});
