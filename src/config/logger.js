import { createLogger, format, transports } from "winston"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logDir = path.join(__dirname, "../../logs")

// Create logs folder if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const isProduction = process.env.NODE_ENV === "production"

// Development format (pretty logs)
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`
  })
)

// Production format (JSON logs)
const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
)

const logger = createLogger({
  level: "info",
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new transports.Console(),

    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error"
    }),

    new transports.File({
      filename: path.join(logDir, "combined.log")
    })
  ],
  exitOnError: false
})

export default logger