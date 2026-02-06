import { buildClientsResponse } from '../../../controllers/clients/ClientsService.js'
import { calculateClientAction } from '../../../services/clients/ClientsActionsEngine.js'
import { trackClientAction } from '../../../services/clients/ClientsActionsTracker.js'

export async function getClientsActions(req, res) {
  try {
    const { limit = 50 } = req.query

    const clients = await buildClientsResponse(req.conn, {
  limit: Number(limit),
})


    const actions = []
    const trackingPromises = []

    for (const client of clients) {
      const { raw, computed, insight } = client

      const actionData = calculateClientAction({
        activo: computed.activo,
        segmentoAuto: computed.segmentoAuto,
        scoreRecompra: computed.scoreRecompra,
        diasSinComprar: raw.diasSinComprar,
        insight,
      })

      actions.push({
        clientId: raw._id,
        nombre: raw.nombre,
        segmentoAuto: computed.segmentoAuto,
        scoreRecompra: computed.scoreRecompra,

        action: actionData.action,
        priority: actionData.priority,
        message: actionData.message,
        reason: actionData.reason,
      })

      // 🔥 TRACKING (no bloqueante)
      trackingPromises.push(
        trackClientAction(req.conn, {
          clientId: raw._id,
          action: actionData.action,
          priority: actionData.priority,
          segmento: computed.segmentoAuto,
          scoreRecompra: computed.scoreRecompra,
          metadata: {
            diasSinComprar: raw.diasSinComprar,
            motivo: actionData.reason,
          },
        })
      )
    }

    await Promise.all(trackingPromises)

    res.json({
      ok: true,
      data: actions,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: 'Error generando acciones IA',
    })
  }
}
