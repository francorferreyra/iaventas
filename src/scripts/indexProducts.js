import "dotenv/config";

import { connectMongo } from "../db/mongo.connections.js";
import { getProductsForIndexing } from "../services/productAggregation.js";
import { buildProductDocument } from "../services/productDocumentBuilder.js";
import { getEmbedding } from "../services/embeddings.service.js";
import { index } from "../services/pinecone.service.js";

const BATCH_SIZE = 100;

async function run() {
  await connectMongo();

  const products = await getProductsForIndexing();
  console.log(`🔍 Productos encontrados: ${products.length}`);

  let batch = [];
  let batchNumber = 1;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    const document = buildProductDocument(product);
    const embedding = await getEmbedding(document);

    batch.push({
      id: `product-${product.cod}`,
      values: embedding,
      metadata: {
        cod: product.cod,
        name: product.name,
        categoria: product.categoria,
        subcategoria: product.subcategoria,
        salient: product.salient,
      },
    });

    if (batch.length === BATCH_SIZE || i === products.length - 1) {
      console.log(`📦 Indexando batch ${batchNumber}`);
      await index.upsert(batch);
      batch = [];
      batchNumber++;
    }
  }

  console.log("✅ Indexación completa");
  process.exit(0);
}

run();
