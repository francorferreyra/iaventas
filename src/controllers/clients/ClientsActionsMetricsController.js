import { getActionsEffectiveness } from '../../services/clients/ClientsActionsMetricsService.js'

export async function getClientsActionsMetrics(req, res) {
  try {
    const data = await getActionsEffectiveness(req.conn)

    res.json({
      ok: true,
      data,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: 'Error obteniendo métricas IA',
    })
  }
}
