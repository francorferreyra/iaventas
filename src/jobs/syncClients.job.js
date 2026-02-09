import cron from 'node-cron'
import { getMarketingConnection } from '../db/mongo.connections.js'
import { syncClientsToPinecone } from '../services/ai/syncClientsToPinecone.js'

export function startClientsSyncJob() {

  cron.schedule('*/5 * * * *', async () => {

    try {

      console.log('🔄 Iniciando sync de clientes a Pinecone...')

      const conn = getMarketingConnection()

      await syncClientsToPinecone(conn)

      console.log('✅ Sync Pinecone finalizado')

    } catch (error) {
      console.error('❌ Error CRON Pinecone:', error)
    }

  })

  console.log('🕐 Cron Pinecone iniciado')
}
