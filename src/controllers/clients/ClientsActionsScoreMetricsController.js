import { getActionsEffectivenessBySegment } from '../../services/clients/ClientsActionsSegmentMetricsService.js'

export async function getClientsActionsScoreMetrics(
  req,
  res
) {
  try {
    const data =
      await getActionsEffectivenessBySegment(req.conn)

    res.json({
      ok: true,
      data,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: 'Error obteniendo métricas por score',
    })
  }
}
