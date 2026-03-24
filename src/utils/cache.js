import redis from "../config/redis.js"

/*
--------------------------------
GET CACHE
--------------------------------
*/

export async function getCache(key) {

  const data = await redis.get(key)

  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }

}

/*
--------------------------------
SET CACHE
--------------------------------
*/

export async function setCache(key, value, ttl = 120) {

  await redis.set(
    key,
    JSON.stringify(value),
    "EX",
    ttl
  )

}

/*
--------------------------------
DELETE CACHE PATTERN
--------------------------------
*/

export async function deleteByPattern(pattern) {

  const keys = await redis.keys(pattern)

  if (!keys.length) return

  await redis.del(keys)

}