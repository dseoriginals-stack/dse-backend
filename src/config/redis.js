import Redis from "ioredis"

let redis = null

try {

  redis = new Redis(
    process.env.REDIS_URL || "redis://127.0.0.1:6379",
    {
      maxRetriesPerRequest: null,
      retryStrategy: () => null
    }
  )

  redis.on("connect", () => {
    console.log("Redis connected")
  })

  redis.on("error", () => {
    console.log("Redis unavailable — running without cache")
    redis = null
  })

} catch {

  console.log("Redis disabled")

}

export default redis