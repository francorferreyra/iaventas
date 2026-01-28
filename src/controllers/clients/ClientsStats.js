import { getMarketingConnection } from '../../db/mongo.connections.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'

export const getClientsStats = async (req, res) => {
  try {
    const conn = getMarketingConnection()
    const ClientMetrics = ClientMetricsModel(conn)

    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - 90)

    const [result] = await ClientMetrics.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          activos: {
            $sum: {
              $cond: [{ $gte: ['$ultimaCompra', limitDate] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          activos: 1,
          inactivos: { $subtract: ['$total', '$activos'] },
        },
      },
    ])

    res.json(result || { total: 0, activos: 0, inactivos: 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error calculando estadísticas' })
  }
}

