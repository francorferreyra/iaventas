import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'
import { connectMongo, getMarketingConnection } from '../../db/mongo.connections.js'
import { ClientAIInsightModel } from '../../models/ClientAIInsight.model.js'
import { getEmbedding } from '../../services/ai/OpenAIService.js'

// ============================
// CONFIG
// ============================
const INDEX_NAME = process.env.PINECONE_INDEX
const NAMESPACE = 'clients'
const BATCH_SIZE = 50

// ============================
// MAIN
// ============================
async function run() {
  console.log('🔌 Conectando a MongoDB...')
  await connectMongo()

  const conn = getMarketingConnection()
  console.log(`✅ Usando conexión marketingIA`)

  const collections = await conn.db.listCollections().toArray()
console.log(
  '📦 Colecciones en marketingia:',
  collections.map(c => c.name)
)

  const ClientAIInsight = ClientAIInsightModel(conn)

 console.log('📦 Model collection:', ClientAIInsight.collection.name)
  const total = await ClientAIInsight.countDocuments()
  console.log(`👀 Clientes encontrados: ${total}`)

  const one = await ClientAIInsight.findOne().lean()
console.log('🧪 Sample doc:', one)

  if (!total) {
    console.log('⚠️ No hay clientes para sincronizar')
    process.exit(0)
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  const index = pinecone.index(INDEX_NAME)

  const cursor = ClientAIInsight.find().lean().cursor()

  let batch = []
  let processed = 0

  for await (const c of cursor) {
    const text = `
Cliente ${c.nombre}.
Segmento: ${c.segmento}.
Prioridad: ${c.prioridad}.
Score recompra: ${c.scoreRecompra}.
Resumen IA: ${c.resumenIA}.
Acción IA: ${c.accionIA}.
Mensaje IA: ${c.mensajeIA}.
    `.trim()

    const embedding = await getEmbedding(text)

    batch.push({
      id: c._id,
      values: embedding,
      metadata: {
        nombre: c.nombre,
        segmento: c.segmento,
        prioridad: c.prioridad,
        scoreRecompra: c.scoreRecompra,
      },
    })

    if (batch.length >= BATCH_SIZE) {
      await index.upsert(batch, { namespace: NAMESPACE })
      processed += batch.length
      console.log(`📤 Subidos: ${processed}/${total}`)
      batch = []
    }
  }

  if (batch.length) {
    await index.upsert(batch, { namespace: NAMESPACE })
    processed += batch.length
  }

  console.log(`🎉 Sincronización completa. Total clientes: ${processed}`)
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
