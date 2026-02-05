import { getClientMetricsWithInsights } from '../clients/ClientsRepository.js   '

export async function getClientsMetrics(req, res) {
  try {
    const { limit, skip } = req.query

    const data = await getClientMetricsWithInsights(req.conn, {
      limit: Number(limit) || 20,
      skip: Number(skip) || 0,
    })

    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error obteniendo métricas de clientes' })
  }
}
