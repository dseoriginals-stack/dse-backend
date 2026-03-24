import prisma from "../config/prisma.js"
import logger from "../config/logger.js"

export async function reconcileInventory() {

  try {

    const paidOrders = await prisma.order.findMany({
      where: { status: "paid" },
      include: { items: true }
    })

    for (const order of paidOrders) {

      for (const item of order.items) {

        const reservation = await prisma.inventoryReservation.findFirst({
          where: {
            orderId: order.id,
            productId: item.productId,
            status: "confirmed"
          }
        })

        if (!reservation) {

          logger.warn("Inventory inconsistency detected", {
            orderId: order.id,
            productId: item.productId
          })

        }

      }

    }

  } catch (err) {

    logger.error("Inventory reconciliation failed", { error: err })

  }

}