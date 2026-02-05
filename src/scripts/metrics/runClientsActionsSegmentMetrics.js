import "dotenv/config"
import mongoose from "mongoose"
import { getActionsEffectivenessBySegment } from "../../services/clients/ClientsActionsSegmentMetricsService.js"
import { connectMongo, getMarketingConnection } from "../../db/mongo.connections.js"

async function run() {
  console.log("🔌 Conectando a MongoDB...")
  await connectMongo()

  const conn = getMarketingConnection()
  console.log("✅ Conectado a MongoDB")

  console.log("📊 Generando métricas por segmento...")
  const data = await getActionsEffectivenessBySegment(conn)

  console.log("🎉 Métricas generadas correctamente")
  console.log("📈 Resultado:", data)

  process.exit(0)
}

run().catch((err) => {
  console.error("❌ Error ejecutando métricas:", err)
  process.exit(1)
})
