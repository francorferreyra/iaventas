import { getMarketingConnection } from '../../db/mongo.connections.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import { ClientAIInsightModel } from '../../models/ClientAIInsight.model.js'
import { calculateClientSegment } from './ClientsSegments.js'

export const getPriorityClients = async (req, res) => {
  try {
    const conn = getMarketingConnection()

    const ClientMetrics = ClientMetricsModel(conn)
    const ClientAIInsight = ClientAIInsightModel(conn)

    const metrics = await ClientMetrics.find({
      ultimaCompra: { $ne: null },
    })

    const ids = metrics.map(c => c._id)

    const insights = await ClientAIInsight.find({
      _id: { $in: ids },
    })

    const mapInsights = Object.fromEntries(
      insights.map(i => [i._id, i])
    )

    const today = new Date()

    const prioritized = metrics
      .map(c => {
        const diasSinComprar = Math.floor(
          (today - new Date(c.ultimaCompra)) / (1000 * 60 * 60 * 24)
        )

        const ia = mapInsights[c._id]
        if (!ia) return null

        const scoreRecompra = ia.scoreRecompra ?? 0

        const segmentoEstado = calculateClientSegment({
          diasSinComprar,
          scoreRecompra,
        })

        let prioridad = null

        if (
          (segmentoEstado === 'riesgo' || segmentoEstado === 'dormido') &&
          scoreRecompra >= 70
        ) {
          prioridad = 'alta'
        } else if (
          segmentoEstado === 'riesgo' &&
          scoreRecompra >= 40
        ) {
          prioridad = 'media'
        }

        if (!prioridad) return null

        return {
          _id: c._id,
          nombre: c.nombre,
          diasSinComprar,
          segmentoEstado,
          scoreRecompra,
          prioridad,
          accionIA: ia.accionIA,
          mensajeIA: ia.mensajeIA,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.scoreRecompra - a.scoreRecompra)

    res.json(prioritized)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error obteniendo clientes prioritarios' })
  }
}
