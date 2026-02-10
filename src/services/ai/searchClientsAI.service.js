import { createEmbedding } from '../ai/openaiEmbedding.service.js'
import { getPineconeIndex } from '../ai/pinecone.service.js'
import { buildClientsResponse } from '../../controllers/clients/ClientsService.js'

export async function searchClientsAI(conn, query, options = {}) {

  const {
    topK = 10
  } = options

  const pineconeIndex = getPineconeIndex()
console.log("Query recibida IA:", query)

  //  1 — Crear embedding del texto de búsqueda
  const embedding = await createEmbedding(query)

  //  2 — Buscar en Pinecone
  const results = await pineconeIndex
    .namespace(process.env.PINECONE_NAMESPACE)
    .query({
      vector: embedding,
      topK,
      includeMetadata: true
    })

  if (!results.matches.length) return []

  //  3 — Obtener IDs encontrados
  const ids = results.matches.map(m => m.id)

  //  4 — Buscar clientes reales en Mongo
  const clients = await buildClientsResponse(conn, {
    ids
  })

  return clients
}
