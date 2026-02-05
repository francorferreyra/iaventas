export async function getOrSetCache(
  redis,
  key,
  ttlSeconds,
  callback
) {
  const cached = await redis.get(key)

  if (cached) {
    return JSON.parse(cached)
  }

  const freshData = await callback()

  await redis.set(
    key,
    JSON.stringify(freshData),
    'EX',
    ttlSeconds
  )

  return freshData
}
