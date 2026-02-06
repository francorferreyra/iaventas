import 'dotenv/config'
import { connectMongo, getMarketingConnection } from '../../db/mongo.connections.js'

async function run() {
  await connectMongo()
  const conn = getMarketingConnection()


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


  process.exit(0)
}

run()
