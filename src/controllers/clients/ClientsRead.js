import { getMarketingConnection } from '../../db/mongo.connections.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import { ClientAIInsightModel } from '../../models/ClientAIInsight.model.js'

export const getClients = async (req, res) => {
  try {
    const conn = getMarketingConnection()

    const ClientMetrics = ClientMetricsModel(conn)
    const ClientAIInsight = ClientAIInsightModel(conn)

    const metrics = await ClientMetrics.find().limit(20)

    const ids = metrics.map(c => c._id)

    const insights = await ClientAIInsight.find({
      _id: { $in: ids },
    })

    const mapInsights = Object.fromEntries(
      insights.map(i => [i._id, i])
    )

    const result = metrics.map(c => ({
      ...c.toObject(),
      ia: mapInsights[c._id] || null,
    }))

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error obteniendo clientes' })
  }
}
