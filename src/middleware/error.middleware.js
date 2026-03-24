import logger from "../config/logger.js"

export default function errorHandler(err, req, res, next) {
  logger.error("Unhandled error", { error: err })

  const status = err.status || 500

  res.status(status).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message
  })
}