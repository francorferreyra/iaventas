import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import { ClientAIInsightModel } from '../../models/ClientAIInsight.model.js'
import {
  calculateClientSegment,
  isClientActive,
} from './ClientsSegments.js'

export async function buildClientsResponse(conn, limit = 20) {
  const ClientMetrics = ClientMetricsModel(conn)
  const ClientAIInsight = ClientAIInsightModel(conn)

  const metrics = await ClientMetrics.find().limit(limit)

  const ids = metrics.map((c) => c._id)

  const insights = await ClientAIInsight.find({
    _id: { $in: ids },
  })

  const mapInsights = Object.fromEntries(
    insights.map((i) => [i._id, i])
  )

  return metrics.map((c) => {
    const ia = mapInsights[c._id] || null
    const diasSinComprar = c.diasSinComprar ?? null
    const score = ia ? Math.round(ia.scoreRecompra * 100) : 0

    return {
      ...c.toObject(),

      ia,

      // 🔥 calculados en backend
      scoreRecompra: score,
      activo: isClientActive(diasSinComprar),
      segmentoAuto: calculateClientSegment({
        diasSinComprar,
        scoreRecompra: score,
      }),
    }
  })
}
