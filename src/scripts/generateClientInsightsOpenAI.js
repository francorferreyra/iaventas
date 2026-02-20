import "dotenv/config"
import OpenAI from "openai"
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const BATCH_SIZE = 50
const DELAY_MS = 600

const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function generateBatch(db) {
  const metrics = db.collection("clients_metrics")
  const insights = db.collection("clients_ai_insights")

  const clients = await metrics.aggregate([
    {
      $lookup: {
        from: "clients_ai_insights",
        localField: "_id",
        foreignField: "_id",
        as: "ai"
      }
    },
    { $match: { ai: { $size: 0 } } },
    { $limit: BATCH_SIZE }
  ]).toArray()

  if (!clients.length) return 0

  console.log(`👥 Procesando batch: ${clients.length} clientes`)

  for (const client of clients) {
    try {
      const cleanClient = {
        cliente: client._id,
        nombre: client.nombre,
        segmento: client.segmento,
        totalFacturado: client.totalFacturado,
        compras: client.compras,
        diasSinComprar: client.diasSinComprar,
        scoreRecompra: client.scoreRecompra
      }

      const prompt = `
Analiza estos datos de cliente y genera insights comerciales B2B.
Responde SOLO JSON válido.

{
  "risk_level": "LOW | MEDIUM | HIGH",
  "recommendations": ["string"],
  "summary": "string"
}

Datos:
${JSON.stringify(cleanClient)}
`

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "Sos un analista experto en marketing B2B." },
          { role: "user", content: prompt }
        ]
      })

      let content = completion.choices?.[0]?.message?.content
      if (!content) continue

      content = content.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(content)

      await insights.updateOne(
        { _id: client._id },
        {
          $set: {
            resumenIA: parsed.summary,
            accionIA: parsed.recommendations?.join("\n• "),
            mensajeIA: `Hola ${client.nombre || "cliente"}, queremos ayudarte a optimizar tus compras.`,
            accionSugerida: parsed.risk_level,
            scoreRecompra: client.scoreRecompra || 0,
            prioridad: client.prioridad || "Media",
            generadoEl: new Date()
          }
        },
        { upsert: true }
      )

      console.log("✅ Insight generado →", client._id)
      await delay(DELAY_MS)

    } catch (err) {
      console.log("❌ Error cliente →", client._id)
    }
  }

  return clients.length
}

async function run() {
  await connectMongo()
  const db = getMarketingConnection()

  console.log("🚀 Generando insights IA (batch automático)")

  let processed = 0
  while (true) {
    const count = await generateBatch(db)
    if (count === 0) break
    processed += count
  }

  console.log(`🎉 Proceso finalizado. Total insights generados: ${processed}`)
  process.exit(0)
}

run()
