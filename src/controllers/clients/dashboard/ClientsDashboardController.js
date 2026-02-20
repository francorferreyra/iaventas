import { buildClientsResponse } from '../../../controllers/clients/ClientsService.js'

export async function getClientsDashboard(req, res) {
  try {
    const response = await buildClientsResponse(req.conn, {
      limit: 1000,
    })

    // 👇 ACA estaba el bug
    const clients = response.clients || []

    const total = clients.length
    const activos = clients.filter(c => c.computed?.activo === true).length
    const inactivos = total - activos

    const vip = clients.filter(c => c.computed?.segmentoAuto === 'vip').length
    const riesgo = clients.filter(c => c.computed?.segmentoAuto === 'riesgo').length

    res.json({
      total,
      activos,
      inactivos,
      vip,
      riesgo,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error cargando dashboard' })
  }
}

