import redis from "../config/redis.js"

/*
-----------------------------------
GET CACHE
-----------------------------------
*/

export const getCache = async (key) => {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    return null
  }
}

/*
-----------------------------------
SET CACHE
-----------------------------------
*/

export const setCache = async (key, value, ttl = 60) => {
  try {
    await redis.set(
      key,
      JSON.stringify(value),
      "EX",
      ttl
    )
  } catch {}
}

/*
-----------------------------------
DELETE CACHE (PATTERN)
-----------------------------------
*/

export const deleteCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await redis.del(keys)
    }
  } catch {}
}