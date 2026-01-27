import { getMarketingConnection } from '../../db/mongo.connections.js'
import { buildClientsResponse } from './ClientsService.js'

export const getClients = async (req, res) => {
  try {
    const conn = getMarketingConnection()

    const clients = await buildClientsResponse(conn, 20)

    res.json(clients)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error obteniendo clientes' })
  }
}
