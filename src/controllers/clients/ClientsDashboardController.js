import { buildClientsResponse } from '../clients/ClientsService.js'

export async function getClientsDashboard(req, res) {
  console.log("entro")
  try {
    const clients = await buildClientsResponse( {
      limit: 1000, // configurable
    })

    const total = clients.length
    const activos = clients.filter(c => c.activo).length
    const inactivos = total - activos
    const vip = clients.filter(c => c.segmentoAuto === 'vip').length
    const riesgo = clients.filter(c => c.segmentoAuto === 'riesgo').length

    res.json({
      total,
      activos,
      inactivos,
      vip,
      riesgo,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Error cargando dashboard' })
  }
}
