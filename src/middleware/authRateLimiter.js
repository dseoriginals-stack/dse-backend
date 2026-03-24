import rateLimit from "express-rate-limit"

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: {
    message: "Too many authentication attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
})

export default authLimiter