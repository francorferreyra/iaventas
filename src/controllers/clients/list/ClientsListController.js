import { buildClientsResponse } from '../../../controllers/clients/ClientsService.js'

export async function getClientsList(req, res) {
  try {
    const {
      limit = 20,
      skip = 0,
      sortBy,
      order,
      activo,
      segmento,
      scoreMin,
    } = req.query

    const clients = await buildClientsResponse(req.conn, {
      limit: Number(limit),
      skip: Number(skip),
      sortBy,
      order,
      filters: {
        activo: activo != null ? activo === 'true' : undefined,
        segmento,
        scoreMin: scoreMin ? Number(scoreMin) : undefined,
      },
    })

    res.json({ data: clients })
  } catch (error) {
    res.status(500).json({ msg: 'Error obteniendo clientes' })
  }
}
