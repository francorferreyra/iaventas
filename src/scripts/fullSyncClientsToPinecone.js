import 'dotenv/config'
import { connectMongo, getMarketingConnection } from '../db/mongo.connections.js'
import { syncClientsToPinecone } from '../services/ai/syncClientsToPinecone.js'

async function run() {
  try {
    console.log('🔌 Conectando a Mongo...')
    await connectMongo()

    const conn = getMarketingConnection()

    console.log('🚀 Iniciando FULL SYNC de clientes a Pinecone...')
    await syncClientsToPinecone(conn, {
      fullSync: true,   // 👈 clave
      batchSize: 100
    })

    console.log('✅ FULL SYNC completado')
    process.exit(0)

  } catch (err) {
    console.error('❌ Error en FULL SYNC:', err)
    process.exit(1)
  }
}

run()
