import prisma from "../config/prisma.js"
import logger from "../config/logger.js"
import { createOrderEvent } from "../services/orderEvent.service.js"
import {
  confirmReservation,
  releaseReservation
} from "../modules/inventory/inventoryService.js"
import { sendOrderPaidEmail } from "../services/email.service.js"

export const handleXenditWebhook = async (req, res) => {
  try {

    const event = req.body

    const callbackToken = req.headers["x-callback-token"]

    if (callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
      return res.status(403).json({ message: "Invalid token" })
    }

    const orderId = event.external_id
    const status = event.status

    if (!orderId) {
      return res.status(400).json({ message: "Missing order ID" })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (status === "PAID") {

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "paid" }
      })

      await confirmReservation(orderId)

      await createOrderEvent(orderId, "paid", "Payment confirmed")

      logger.info("Order PAID", { orderId })
      
      const user = await prisma.user.findUnique({
        where: { id: order.userId }
        })

        await sendOrderPaidEmail(
        user?.email || order.guestEmail,
        order
        )
    }

    if (status === "EXPIRED") {

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "cancelled" }
      })

      await releaseReservation(orderId)

      await createOrderEvent(orderId, "cancelled", "Payment expired")

      logger.info("Order EXPIRED", { orderId })
    }

    return res.json({ success: true })

  } catch (err) {

    logger.error("Webhook error", { error: err.message })

    return res.status(500).json({ message: "Webhook failed" })
  }
}