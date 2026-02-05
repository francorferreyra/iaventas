import 'dotenv/config'
import mongoose from 'mongoose'

// ============================
// CONFIG
// ============================
const MONGO_URI = process.env.MONGODB_URI
const DB_NAME = 'marketingia'

// ============================
// CONEXIÓN
// ============================
async function connectMongo() {
  console.log('🔌 Conectando a MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ Conectado a MongoDB')
}

// ============================
// REGLAS DE NEGOCIO
// ============================
function calcularSegmento(totalFacturado, compras) {
  if (totalFacturado > 5_000_000 || compras >= 50) return 'VIP'
  if (totalFacturado > 1_000_000 || compras >= 20) return 'FRECUENTE'
  return 'OCASIONAL'
}

function calcularPrioridad(segmento) {
  if (segmento === 'VIP') return 'Alta'
  if (segmento === 'FRECUENTE') return 'Media'
  return 'Baja'
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
  await connectMongo()
  const db = mongoose.connection.db

  const sales = db.collection('sales')
  const clientsMetrics = db.collection('clients_metrics')

  console.log('📊 Generando métricas de clientes...')

  // Limpieza previa (opcional pero recomendado)
  await clientsMetrics.deleteMany({})
  console.log('🧹 clients_metrics limpiado')

  const pipeline = [
    {
      $group: {
        _id: '$CUIT',
        nombre: { $first: '$Nombre' },
        totalFacturado: { $sum: '$Total' },
        compras: { $sum: 1 },
        ultimaCompra: { $max: '$Fecha' },
      },
    },
  ]

  const cursor = sales.aggregate(pipeline)
  let total = 0

  for await (const c of cursor) {
    if (!c._id) continue

    const diasSinComprar = c.ultimaCompra
      ? Math.floor(
          (Date.now() - new Date(c.ultimaCompra)) / (1000 * 60 * 60 * 24)
        )
      : null

    const segmento = calcularSegmento(c.totalFacturado, c.compras)
    const prioridad = calcularPrioridad(segmento)
    const scoreRecompra = calcularScoreRecompra(
      c.compras,
      diasSinComprar ?? 999
    )

    await clientsMetrics.updateOne(
      { _id: c._id },
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
        },
      },
      { upsert: true }
    )

    total++
  }

  console.log(`🎉 clients_metrics generado correctamente`)
  console.log(`👥 Total clientes procesados: ${total}`)

  process.exit(0)
}

// ============================
run().catch((err) => {
  console.error('❌ Error general:', err)
  process.exit(1)
})
