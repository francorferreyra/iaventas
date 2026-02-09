export function buildClientVectorText(client) {

  const { raw, computed, insight } = client

  return `
Cliente: ${raw.nombre}

Segmento: ${computed.segmentoAuto}
Score recompra: ${computed.scoreRecompra}
Días sin comprar: ${raw.diasSinComprar}

Insight IA: ${insight?.summary ?? 'Sin insight'}
`
}
