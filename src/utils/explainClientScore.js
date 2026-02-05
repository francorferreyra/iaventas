export function explainClientScore(client, score) {
  const reasons = []

  if (client.totalFacturado > 500000) {
    reasons.push('alto nivel de facturación histórica')
  }

  if (client.compras >= 5) {
    reasons.push('frecuencia de compra recurrente')
  }

  if (client.diasSinComprar <= 30) {
    reasons.push('compra reciente')
  } else if (client.diasSinComprar <= 90) {
    reasons.push('actividad moderada reciente')
  } else {
    reasons.push('inactividad prolongada')
  }

  const rubrosCount = client.rubrosFrecuentes?.length || 0
  if (rubrosCount >= 3) {
    reasons.push('diversidad de intereses')
  }

  if (!reasons.length) {
    return 'Score calculado con información básica del cliente'
  }

  return `El score se basa en ${reasons.join(', ')}.`
}
