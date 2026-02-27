import { buildClientsResponse } from '../clients/ClientsService.js'
import { calculateClientAction } from '../../services/clients/ClientsActionsEngine.js'
import { trackClientAction } from '../../services/clients/ClientsActionsTracker.js'
import { getActionsEffectiveness } from '../../services/clients/ClientsActionsMetricsService.js'
import { getActionsEffectivenessBySegment } from '../../services/clients/ClientsActionsSegmentMetricsService.js'
import { getClientMetricsWithInsights } from '../clients/ClientsRepository.js'

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

export async function getClientsDashboard(req, res) {
  try {
    const response = await buildClientsResponse(req.conn, {
      limit: 1000,
    })

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

export async function getTopClients(req, res) {
  try {
    const limit = Number(req.query.limit) || 10

    const data = await buildClientsResponse(req.conn, {
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

export async function getClientsActionsMetrics(req, res) {
  try {
    const data = await getActionsEffectiveness(req.conn)

    res.json({
      ok: true,
      data,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: 'Error obteniendo métricas IA',
    })
  }
}

export async function getClientsActionsSegmentMetrics(
  req,
  res
) {
  try {
    const data =
      await getActionsEffectivenessBySegment(req.conn)

    res.json({
      ok: true,
      data,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: 'Error obteniendo métricas por segmento',
    })
  }
}

export async function getClientsActionsScoreMetrics(
  req,
  res
) {
  try {
    const data =
      await getActionsEffectivenessBySegment(req.conn)

    res.json({
      ok: true,
      data,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: 'Error obteniendo métricas por score',
    })
  }
}

export async function getClientsMetrics(req, res) {
  try {
    const { limit, skip } = req.query

    const data = await getClientMetricsWithInsights(req.conn, {
      limit: Number(limit) || 20,
      skip: Number(skip) || 0,
    })

    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error obteniendo métricas de clientes' })
  }
}
