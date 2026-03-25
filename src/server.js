import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import path from "path"

import logger from "./config/logger.js"
import passport from "./config/passport.js"
import errorHandler from "./middleware/error.middleware.js"

// Routes
import authRoutes from "./modules/auth/auth.routes.js"
import productRoutes from "./modules/product/product.routes.js"
import recommendationRoutes from "./modules/product/recommendation.routes.js"
import orderRoutes from "./modules/order/order.routes.js"
import adminRoutes from "./modules/admin/admin.routes.js"
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js"
import cartRoutes from "./modules/cart/cart.routes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import reviewRoutes from "./modules/review/review.routes.js"
import analyticsRoutes from "./modules/analytics/analytics.routes.js"
import userRoutes from "./modules/user/user.routes.js"

// ❌ KEEP DISABLED FOR NOW (avoid timeout)
// import { startInventoryWorker } from "./workers/inventoryWorker.js"
// import "./jobs/cron.js"

// Webhooks
import { handleXenditWebhook } from "./webhooks/xendit.webhook.js"

const app = express()

console.log("🚀 STARTING SERVER...")

app.set("trust proxy", 1)

// =========================
// 🔥 DEBUG ORIGIN (CRITICAL)
// =========================
app.use((req, res, next) => {
  console.log("🌍 REQUEST ORIGIN:", req.headers.origin)
  next()
})

// =========================
// ✅ TEMP WORKING CORS (ALLOW ALL)
// =========================
app.use(
  cors({
    origin: true, // 🔥 allow all origins dynamically
    credentials: true,
  })
)

// =========================
// SECURITY
// =========================
app.use(helmet())

// =========================
// STATIC FILES
// =========================
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
)

// =========================
// WEBHOOK RAW
// =========================
app.use("/webhooks/xendit", express.raw({ type: "*/*" }))
app.use("/api/orders/webhook", express.raw({ type: "*/*" }))

// =========================
// PARSERS
// =========================
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())

app.use(passport.initialize())

logger.info("Loading API routes...")

// =========================
// ROUTES
// =========================
app.use("/api/user", userRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/reviews", reviewRoutes)

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/recommendations", recommendationRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/admin", adminRoutes)

// =========================
// WEBHOOK
// =========================
app.post("/webhooks/xendit", handleXenditWebhook)

// =========================
// HEALTH CHECK
// =========================
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "DSE Originals API",
    timestamp: new Date(),
  })
})

// =========================
// ERROR HANDLER
// =========================
app.use(errorHandler)

// =========================
// 🚀 START SERVER
// =========================
const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log("🔥 SERVER RUNNING ON PORT", PORT)
})