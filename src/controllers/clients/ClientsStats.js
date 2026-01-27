import { getMarketingConnection } from '../../db/mongo.connections.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'

export const getClientsStats = async (req, res) => {
  try {
    const conn = getMarketingConnection()
    const ClientMetrics = ClientMetricsModel(conn)

    const today = new Date()
    const limitDate = new Date()
    limitDate.setDate(today.getDate() - 90)

    const total = await ClientMetrics.countDocuments()

    const activos = await ClientMetrics.countDocuments({
      ultimaCompra: { $gte: limitDate },
    })

    const inactivos = total - activos

    res.json({ total, activos, inactivos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error calculando estadísticas' })
  }
}
