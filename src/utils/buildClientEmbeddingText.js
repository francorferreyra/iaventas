export function buildClientEmbeddingText(metric, insight) {
  return `
Cliente ${metric.nombre || 'sin nombre'}
Segmento: ${metric.segmento || 'no definido'}
Estado: ${metric.activo ? 'activo' : 'inactivo'}

Total facturado: ${metric.totalFacturado || 0}
Cantidad de compras: ${metric.cantidadCompras || 0}
Días sin comprar: ${metric.diasSinComprar || 0}

Score: ${metric.score || 'N/A'}
Riesgo: ${metric.riesgo || 'N/A'}

Insight IA:
${insight?.resumen || 'Sin insight'}

Acciones sugeridas:
${insight?.acciones?.join(', ') || 'Ninguna'}
`.trim()
}
