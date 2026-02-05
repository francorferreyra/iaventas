import 'dotenv/config'
import { connectMongo, getMarketingConnection } from '../../db/mongo.connections.js'

async function run() {
  await connectMongo()
  const conn = getMarketingConnection()

  console.log('📛 DB real:', conn.db.databaseName)
  console.log('🌐 URI:', process.env.MONGODB_URI)

  const collections = await conn.db.listCollections().toArray()
  console.log(
    '📦 Colecciones:',
    collections.map(c => c.name)
  )

  const count = await conn.db
    .collection('clients_ai_insights')
    .countDocuments()

  const one = await conn.db
    .collection('clients_ai_insights')
    .findOne()

  console.log('RAW count:', count)
  console.log('RAW sample:', one)

  process.exit(0)
}

run()
