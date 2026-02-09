// 1️⃣ Config Pinecone + OpenAI
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

import { getMarketingConnection } from '../../db/mongo.connections.js'
import { buildClientsResponse } from '../../controllers/clients/ClientsService.js'

// 🔑 Config clientes
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

const index = pinecone.index(process.env.PINECONE_INDEX)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 2️⃣ Texto semántico del cliente
function buildClientSemanticText(client) {
  const { raw, computed } = client

  return `
Cliente ${raw.nombre}
Segmento ${computed.segmentoAuto}
Activo ${computed.activo}
Score recompra ${computed.scoreRecompra}
Dias sin comprar ${raw.diasSinComprar}
Total compras ${raw.totalCompras ?? 0}
Total facturado ${raw.totalFacturado ?? 0}
`
}

// 3️⃣ Generar embedding
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

// 4️⃣ Cliente → vector Pinecone
async function buildVector(client) {
  const text = buildClientSemanticText(client)
  const embedding = await createEmbedding(text)

  return {
    id: String(client.raw._id),
    values: embedding,
    metadata: {
      nombre: client.raw.nombre,
      segmento: client.computed.segmentoAuto,
      activo: client.computed.activo,
      score: client.computed.scoreRecompra,
      diasSinComprar: client.raw.diasSinComprar,
    },
  }
}

// 5️⃣ Sync completo a Pinecone (EXPORTADO)
export async function syncClientsToPinecone() {
  console.log('🔄 Sync clientes → Pinecone')

  const conn = getMarketingConnection()

  const clients = await buildClientsResponse(conn, {
    limit: 10000, // tus 689 entran de sobra
  })

  console.log(`📊 Clientes encontrados: ${clients.length}`)

  const batchSize = 50

  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize)

    const vectors = []

    for (const client of batch) {
      const vector = await buildVector(client)
      vectors.push(vector)
    }

    await index.namespace('clients').upsert(vectors)

    console.log(`✅ Batch subido ${i + batch.length}`)
  }

  console.log('🎉 Sync terminado')
}
