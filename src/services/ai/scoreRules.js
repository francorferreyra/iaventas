export function calculateDeterministicScore(client) {
  let score = 0;

  /* ======================
     Total facturado
  ====================== */
  if (client.totalFacturado >= 500000) score += 30;
  else if (client.totalFacturado >= 200000) score += 20;
  else if (client.totalFacturado >= 50000) score += 10;

  /* ======================
     Cantidad de compras
  ====================== */
  if (client.compras >= 20) score += 25;
  else if (client.compras >= 10) score += 18;
  else if (client.compras >= 5) score += 10;

  /* ======================
     Recencia (días)
  ====================== */
  if (client.diasSinComprar <= 15) score += 25;
  else if (client.diasSinComprar <= 30) score += 18;
  else if (client.diasSinComprar <= 60) score += 10;
  else score -= 10;

  /* ======================
     Normalización
  ====================== */
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}

export function classifyScore(score) {
  if (score >= 80) return "VIP";
  if (score >= 60) return "FRECUENTE";
  if (score >= 40) return "OCASIONAL";
  return "RIESGO";
}
