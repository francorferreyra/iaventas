export function normalizeScore(score) {
  return Math.round(Math.max(0, Math.min(1, score)) * 100)
}
