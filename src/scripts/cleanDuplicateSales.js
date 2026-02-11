import "dotenv/config"
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js"
import mongoose from "mongoose"

async function cleanDuplicates() {
  try {

    console.log("🔌 Conectando Mongo...")
    await connectMongo()

    const conn = getMarketingConnection()

    const Sales = conn.collection("sales")

    console.log("🔍 Buscando duplicados...")

    const cursor = Sales.aggregate([
      {
        $group: {
          _id: {
            Comprobante: "$Comprobante",
            Cliente: "$Cliente",
            Articulo: "$Articulo"
          },
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ])

    let groups = 0
    let deleted = 0

    for await (const doc of cursor) {

      groups++

      const ids = doc.ids

      // 👉 dejamos el primero
      const [keep, ...remove] = ids

      if (remove.length) {

        const result = await Sales.deleteMany({
          _id: { $in: remove }
        })

        deleted += result.deletedCount
      }

      if (groups % 50 === 0) {
        console.log(`📊 Grupos procesados: ${groups} | Eliminados: ${deleted}`)
      }
    }

    console.log("✅ Limpieza terminada")
    console.log(`📦 Grupos duplicados: ${groups}`)
    console.log(`🗑 Registros eliminados: ${deleted}`)

    process.exit(0)

  } catch (error) {

    console.error("❌ Error limpiando duplicados:", error)
    process.exit(1)

  }
}

cleanDuplicates()
