import { buildClientsResponse } from '../../../controllers/clients/ClientsService.js'

export async function getClientsDashboard(req, res) {
  try {
    const clients = await buildClientsResponse( {
      limit: 1000,
    })

    const total = clients.length
    const activos = clients.filter(c => c.activo).length
    const inactivos = total - activos
    const vip = clients.filter(c => c.segmentoAuto === 'vip').length
    const riesgo = clients.filter(c => c.segmentoAuto === 'riesgo').length

    const data = {
      total,
      activos,
      inactivos,
      vip,
      riesgo,
    }

    res.json(data)

  } catch (error) {
    res.status(500).json({ msg: 'Error cargando dashboard' })
  }
}
