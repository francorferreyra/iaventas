import { Pinecone } from "@pinecone-database/pinecone";
import { buildProductText } from "./semanticBuilder.js";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX);

export async function indexProducts(products, embedModel) {
  const batchSize = 50;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    const vectors = await Promise.all(
      batch.map(async (p) => {
        const text = buildProductText(p);

        const embedding = await embedModel.embedContent({
          content: { parts: [{ text }] }
        });

        return {
          id: `product_${p.cod}`,
          values: embedding.embedding.values,
          metadata: {
            cod: p.cod,
            categoria: p.categoria,
            subcategoria: p.subcategoria,
            salient: p.salient
          }
        };
      })
    );

    await index.upsert(vectors);
    console.log(`📦 Indexados ${i + vectors.length}/${products.length}`);
  }
}
