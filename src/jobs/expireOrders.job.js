import prisma from "../config/prisma.js"
import logger from "../config/logger.js"

export async function expireUnpaidOrders() {

  try {

    const expiryTime = new Date(Date.now() - 15 * 60 * 1000)

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "pending",
        createdAt: {
          lt: expiryTime
        }
      },
      include: {
        items: true
      }
    })

    for (const order of expiredOrders) {

      await prisma.$transaction(async (tx) => {

        await tx.order.update({
          where: { id: order.id },
          data: { status: "cancelled" }
        })

        await tx.inventoryReservation.updateMany({
          where: {
            orderId: order.id,
            status: "reserved"
          },
          data: {
            status: "expired"
          }
        })

      })

      logger.info("Order expired and inventory released", {
        orderId: order.id
      })

    }

  } catch (err) {

    logger.error("Order expiration worker failed", { error: err })

  }

}