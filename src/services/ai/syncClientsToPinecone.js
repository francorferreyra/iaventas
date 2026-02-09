import { buildClientsResponse } from '../../controllers/clients/ClientsService.js'
import { createEmbedding } from './openaiEmbedding.service.js'
import { getPineconeIndex } from './pinecone.service.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import { buildClientVectorText } from '../clients/ClientsVectorBuilder.js'

const VECTOR_VERSION = 1
const BATCH_SIZE = 50

export async function syncClientsToPinecone(conn, options = {}) {

  const {
    fullSync = false,
    batchSize = BATCH_SIZE
  } = options

  console.log('🧠 Sync Pinecone iniciado')
  console.log('Modo FULL SYNC:', fullSync)

  const pineconeIndex = getPineconeIndex()
  const ClientMetrics = ClientMetricsModel(conn)

  let totalProcessed = 0
  let skip = 0   // 🔥 PAGINACIÓN REAL

  while (true) {

    const { clients, rawCount } = await buildClientsResponse(conn, {
      limit: batchSize,
      skip, // 🔥 IMPORTANTÍSIMO
      disableComputedFilters: true, // 🔥 evita que el filtrado rompa la paginación
      filters: fullSync
        ? {}
        : {
            needsVector: true,
            vectorVersion: VECTOR_VERSION
          }
    })

    console.log("📦 Clientes obtenidos:", clients.length)

    // 🔥 CORTE CORRECTO
    if (rawCount === 0) break

    const vectors = []

    for (const client of clients) {

      const text = buildClientVectorText(client)
      const embedding = await createEmbedding(text)

      vectors.push({
        id: String(client.raw._id),
        values: embedding,
        metadata: {
          nombre: client.raw.nombre,
          segmento: client.computed.segmentoAuto,
          score: client.computed.scoreRecompra,
        }
      })
    }

    if (vectors.length) {

      await pineconeIndex
        .namespace(process.env.PINECONE_NAMESPACE)
        .upsert(vectors)

      // 🔥 Marcar como vectorizado
      const ids = clients.map(c => c.raw._id)

      await ClientMetrics.updateMany(
        { _id: { $in: ids } },
        {
          vectorizedAt: new Date(),
          vectorVersion: VECTOR_VERSION
        }
      )

      totalProcessed += clients.length
      console.log(`✔ Procesados: ${totalProcessed}`)
    }

    // 🔥 AVANZA PAGINACIÓN
    skip += batchSize
  }

  console.log('✅ Sync Pinecone terminado')
}
