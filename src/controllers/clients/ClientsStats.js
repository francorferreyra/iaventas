import { getMarketingConnection } from '../../db/mongo.connections.js'
import {ClientMetricsModel} from '../../models/ClientMetrics.model.js'

export const getClientsStats = async (req, res) => {
  try {
    const conn = getMarketingConnection()

    const ClientMetrics = ClientMetricsModel(conn)
    const clients = await ClientMetrics.find(
      {},
      { ultimaCompra: 1 } // solo lo necesario
    )

    const today = new Date()

    let activos = 0
    let inactivos = 0

    clients.forEach((c) => {
      if (!c.ultimaCompra) {
        inactivos++
        return
      }

      const diffDays =
        (today - new Date(c.ultimaCompra)) / (1000 * 60 * 60 * 24)

      if (diffDays <= 90) activos++
      else inactivos++
    })

    res.json({
      total: clients.length,
      activos,
      inactivos,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error calculando estadísticas' })
  }
}
