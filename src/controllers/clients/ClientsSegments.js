export function calculateClientSegment({ diasSinComprar, scoreRecompra }) {
  if (diasSinComprar == null) {
    return 'nuevo'
  }

  if (diasSinComprar <= 30 && scoreRecompra >= 80) {
    return 'vip'
  }

  if (diasSinComprar <= 90 && scoreRecompra >= 50) {
    return 'riesgo'
  }

  if (diasSinComprar > 90) {
    return 'dormido'
  }

  return 'nuevo'
}

export function isClientActive(diasSinComprar) {
  if (diasSinComprar == null) return false
  return diasSinComprar <= 90
}
