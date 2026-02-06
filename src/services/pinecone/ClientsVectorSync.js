import { pineconeIndex } from "./PineconeClient.js"
import { buildClientVector } from "./ClientsVectorBuilder.js"

export async function syncClientVector(client) {

  const vector = await buildClientVector(client)

  await pineconeIndex.upsert([
    {
      id: String(client.raw._id),
      values: vector,
      metadata: {
        nombre: client.raw.nombre,
        segmento: client.computed.segmentoAuto,
        score: client.computed.scoreRecompra
      }
    }
  ])
}

export async function syncAllClients(clients) {
  await Promise.all(
    clients.map(syncClientVector)
  )
}

