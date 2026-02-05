import { buildClientsResponse } from '../../clients/ClientsService.js'

export async function getTopClients(req, res) {
  try {
    const limit = Number(req.query.limit) || 10

    const data = await buildClientsResponse( {
      limit,
      sortBy: 'scoreRecompra',
      order: 'desc',
      filters: { activo: true },
    })

    res.json({ data })

  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo top clientes' })
  }
}
