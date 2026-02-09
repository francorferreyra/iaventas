import { getClientMetricsWithInsights } from './ClientsRepository.js'
import { enrichClient } from './ClientsEnricher.js'

const DB_SORT_FIELDS = ['diasSinComprar', 'createdAt', 'nombre']
const MEMORY_SORT_FIELDS = ['scoreRecompra', 'activo', 'segmentoAuto']

export async function buildClientsResponse(conn,
  {
    limit = 20,
    skip = 0,
    filters = {},
    sortBy = 'createdAt',
    order = 'desc',
  } = {}
) {
  const sortOrder = order === 'asc' ? 1 : -1

  const mongoSort = DB_SORT_FIELDS.includes(sortBy)
    ? { [sortBy]: sortOrder }
    : null

  // 🔥 SIN conn
  const rawData = await getClientMetricsWithInsights(conn,{
    limit,
    skip,
    filters,
    sort: mongoSort,
  })

  let result = rawData.map(enrichClient)

  // filtros post-cálculo
  if (filters.activo != null) {
    result = result.filter(
      c => c.computed.activo === filters.activo
    )
  }

  if (filters.segmento) {
    result = result.filter(
      c => c.computed.segmentoAuto === filters.segmento
    )
  }

  if (filters.scoreMin != null) {
    result = result.filter(
      c => c.computed.scoreRecompra >= filters.scoreMin
    )
  }

  if (filters.scoreMax != null) {
    result = result.filter(
      c => c.computed.scoreRecompra <= filters.scoreMax
    )
  }

  // orden en memoria
  if (MEMORY_SORT_FIELDS.includes(sortBy)) {
    result.sort((a, b) => {
      const A = a.computed[sortBy]
      const B = b.computed[sortBy]
      return order === 'asc' ? A - B : B - A
    })
  }

  return {
  clients: result,
  rawCount: rawData.length
}

}
