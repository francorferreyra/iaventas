import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import { ClientAIInsightModel } from '../../models/ClientAIInsight.model.js'

export async function getClientMetricsWithInsights(
  { limit = 20, skip = 0, filters = {}, sort } = {}
) {
  const ClientMetrics = ClientMetricsModel()
  const ClientAIInsight = ClientAIInsightModel()

  const metricsQuery = {}

  if (filters.diasSinComprarMin != null) {
    metricsQuery.diasSinComprar = {
      ...(metricsQuery.diasSinComprar || {}),
      $gte: filters.diasSinComprarMin,
    }
  }

  if (filters.diasSinComprarMax != null) {
    metricsQuery.diasSinComprar = {
      ...(metricsQuery.diasSinComprar || {}),
      $lte: filters.diasSinComprarMax,
    }
  }

  const query = ClientMetrics.find(metricsQuery)

  if (sort) {
    query.sort(sort)
  }

  const metrics = await query
    .skip(skip)
    .limit(limit)
    .lean()

  if (!metrics.length) return []

  const ids = metrics.map(c => c._id)

  const insights = await ClientAIInsight.find({
    _id: { $in: ids },
  }).lean()

  const insightsMap = Object.fromEntries(
    insights.map(i => [String(i._id), i])
  )

  return metrics.map(metric => ({
    metric,
    insight: insightsMap[String(metric._id)] ?? null,
  }))
}
