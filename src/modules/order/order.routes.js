import express from "express"

import prisma from "../../config/prisma.js"
import authenticate from "../../middleware/auth.middleware.js"
import requireRole from "../../middleware/role.middleware.js"

import * as controller from "./order.controller.js"
import { handleXenditWebhook } from "./webhook.controller.js"
import { getTrackingInfo } from "../../services/tracking.service.js"

const router = express.Router()

/* =============================
   CHECKOUT
============================= */

router.post("/checkout", controller.createOrder)

// optional order creation endpoint
router.post("/", controller.createOrder)

/* =============================
   ADMIN / STAFF ROUTES
============================= */

router.get(
  "/",
  authenticate,
  requireRole("admin"),
  controller.getAllOrders
)

router.put(
  "/:id/status",
  authenticate,
  requireRole("staff"),
  controller.updateOrderStatus
)

/* =============================
   USER ORDER ROUTES
============================= */

router.get(
  "/:id",
  authenticate,
  controller.getSingleOrder
)

router.get(
  "/:id/invoice",
  authenticate,
  controller.generateInvoice
)

router.post(
  "/:id/refund",
  authenticate,
  requireRole("admin"),
  controller.refundOrder
)

/* =============================
   ORDER TRACKING
============================= */

router.get("/:id/tracking", authenticate, async (req, res) => {

  try {

    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order || !order.trackingNo) {
      return res.json({ events: [] })
    }

    const events = await getTrackingInfo(order.trackingNo)

    res.json({ events })

  } catch (err) {

    res.status(500).json({
      message: "Tracking failed"
    })

  }

})

/* =============================
   XENDIT WEBHOOK
============================= */

router.post("/webhook", handleXenditWebhook)

router.get("/", controller.getAllOrders)

router.put(
  "/:id/status",
  authenticate,
  requireRole("admin"),
  controller.updateOrderStatus
)

export default router