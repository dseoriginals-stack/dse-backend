import express from "express"
import { getAnalytics } from "./analytics.controller.js"
import authenticate from "../../middleware/auth.middleware.js"
import requireRole from "../../middleware/role.middleware.js"

const router = express.Router()

router.get(
  "/",
  authenticate,
  requireRole("admin"),
  getAnalytics
)

export default router