export function calculateClientAction({
  activo,
  segmentoAuto,
  scoreRecompra,
  diasSinComprar,
  insight,
}) {
  if (!activo || segmentoAuto === 'riesgo') {
    return {
      action: 'RECUPERAR',
      priority: 'alta',
      message: insight?.suggestedAction
        ?? 'Cliente en riesgo. Enviar incentivo de reactivación.',
      reason: 'Muchos días sin comprar y bajo score de recompra',
    }
  }

  if (segmentoAuto === 'vip' && scoreRecompra >= 80) {
    return {
      action: 'UPSELL',
      priority: 'media',
      message: 'Cliente VIP. Ofrecer producto premium.',
      reason: 'Alto score y compras frecuentes',
    }
  }

  if (scoreRecompra >= 40) {
    return {
      action: 'FIDELIZAR',
      priority: 'media',
      message: 'Cliente activo. Reforzar vínculo.',
      reason: 'Score medio de recompra',
    }
  }

  return {
    action: 'MANTENER',
    priority: 'baja',
    message: 'Cliente estable. Mantener comunicación regular.',
    reason: 'Buen comportamiento general',
  }
}
