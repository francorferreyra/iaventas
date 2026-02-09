import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import { ClientAIInsightModel } from '../../models/ClientAIInsight.model.js'

export async function getClientMetricsWithInsights(
  conn,
  {
    limit = 20,
    skip = 0,
    filters = {},
    sort = null,
  } = {}
) {

  const ClientMetrics = ClientMetricsModel(conn)
  const ClientAIInsight = ClientAIInsightModel(conn)

  const metricsQuery = {}

  // ===============================
  // 📊 FILTROS EXISTENTES
  // ===============================

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

  // ===============================
  // 🧠 FILTROS PARA PINECONE
  // ===============================

  if (filters.needsVector === true) {

    const CURRENT_VECTOR_VERSION = filters.vectorVersion ?? 1

    metricsQuery.$or = [
      { vectorizedAt: { $exists: false } },
      { vectorVersion: { $ne: CURRENT_VECTOR_VERSION } }
    ]
  }

  // ===============================
  // 🔥 QUERY PRINCIPAL
  // ===============================

  const query = ClientMetrics.find(metricsQuery)

  if (sort) {
    query.sort(sort)
  }

  const metrics = await query
    .skip(skip)
    .limit(limit)
    .lean()

  if (!metrics.length) return []

  // ===============================
  // 🔎 INSIGHTS
  // ===============================

  const ids = metrics.map(c => c._id)

  const insights = await ClientAIInsight.find({
    _id: { $in: ids }
  }).lean()

  const insightsMap = Object.fromEntries(
    insights.map(i => [String(i._id), i])
  )

  return metrics.map(metric => ({
    metric,
    insight: insightsMap[String(metric._id)] ?? null
  }))
}
