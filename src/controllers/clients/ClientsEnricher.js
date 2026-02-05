import {
  calculateClientSegment,
  isClientActive,
} from '../../utils/clients/ClientsSegments.js'

export function enrichClient({ metric, insight }) {
  const diasSinComprar = metric.diasSinComprar ?? null

  const scoreRecompra = insight
    ? Math.round(insight.scoreRecompra * 100)
    : 0

  const activo = isClientActive(diasSinComprar)

  const segmentoAuto = calculateClientSegment({
    diasSinComprar,
    scoreRecompra,
  })

  return {
    raw: metric,
    insight,

    computed: {
      scoreRecompra,
      activo,
      segmentoAuto,
    },
  }
}
