import "dotenv/config"
import { connectMongo, getMarketingConnection } from "../../db/mongo.connections.js"

// ============================
// REGLAS DE NEGOCIO
// ============================

function calcularSegmento(totalFacturado, compras) {
  if (totalFacturado > 5_000_000 || compras >= 50) return "VIP"
  if (totalFacturado > 1_000_000 || compras >= 20) return "FRECUENTE"
  return "OCASIONAL"
}

function calcularPrioridad(segmento) {
  if (segmento === "VIP") return "Alta"
  if (segmento === "FRECUENTE") return "Media"
  return "Baja"
}

function calcularScoreRecompra(compras, diasSinComprar) {
  let score = 0
  score += Math.min(compras / 50, 1) * 0.6
  score += diasSinComprar < 30 ? 0.4 : diasSinComprar < 90 ? 0.2 : 0
  return Number(score.toFixed(2))
}

// ============================
// MAIN
// ============================

async function run() {

  console.log("🔌 Conectando a MongoDB...")
  await connectMongo()

  const conn = getMarketingConnection()
  console.log("✅ DB usada:", conn.name)

  const sales = conn.collection("sales")
  const clientsMetrics = conn.collection("clients_metrics")

  console.log("📊 Generando métricas de clientes...")

  await clientsMetrics.deleteMany({})
  console.log("🧹 clients_metrics limpiado")

  const pipeline = [
    {
      $match: {
        Cliente: { $exists: true, $ne: "" }
      }
    },
    {
      $group: {
        _id: "$Cliente",
        nombre: { $first: "$NombreCliente" },
        totalFacturado: { $sum: "$Total" },
        compras: { $sum: 1 },
        ultimaCompra: { $max: "$Fecha" }
      }
    }
  ]

  const cursor = sales.aggregate(pipeline)

  let total = 0

  for await (const c of cursor) {

    const diasSinComprar = c.ultimaCompra
      ? Math.floor(
          (Date.now() - new Date(c.ultimaCompra)) /
          (1000 * 60 * 60 * 24)
        )
      : null

    const segmento = calcularSegmento(c.totalFacturado, c.compras)
    const prioridad = calcularPrioridad(segmento)
    const scoreRecompra = calcularScoreRecompra(
      c.compras,
      diasSinComprar ?? 999
    )

    await clientsMetrics.updateOne(
      { _id: String(c._id) },
      {
        $set: {
          nombre: c.nombre,
          totalFacturado: Number(c.totalFacturado.toFixed(2)),
          compras: c.compras,
          ultimaCompra: c.ultimaCompra,
          diasSinComprar,
          segmento,
          prioridad,
          scoreRecompra,
          generadoEl: new Date(),
        }
      },
      { upsert: true }
    )

    total++
  }

  console.log("🎉 clients_metrics generado correctamente")
  console.log("👥 Total clientes procesados:", total)

  process.exit(0)
}

run().catch(err => {
  console.error("❌ Error general:", err)
  process.exit(1)
})
