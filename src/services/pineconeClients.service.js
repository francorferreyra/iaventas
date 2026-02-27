import { Pinecone } from '@pinecone-database/pinecone'
import { buildClientEmbeddingText } from '../utils/buildClientEmbeddingText.js'
import { getEmbedding } from '../services/ai/OpenAIService.js'

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

export async function upsertClientsToPinecone(clients) {
  const index = pc.index(process.env.PINECONE_INDEX)

  const vectors = []

  for (const { metric, insight } of clients) {
    const text = buildClientEmbeddingText(metric, insight)
    const embedding = await getEmbedding(text)

    vectors.push({
      id: String(metric._id),
      values: embedding,
      metadata: {
        nombre: metric.nombre,
        segmento: metric.segmento,
        activo: metric.activo,
        riesgo: metric.riesgo,
      },
    })
  }

  if (vectors.length) {
    await index.upsert(vectors)
  }

  console.log(`✅ ${vectors.length} clientes sincronizados con Pinecone`)
}
