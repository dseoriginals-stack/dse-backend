import prisma from "../config/prisma.js"

export async function releaseExpiredReservations() {

  const expired = await prisma.inventoryReservation.findMany({
    where: {
      expiresAt: {
        lt: new Date()
      },
      orderId: null
    }
  })

  for (const r of expired) {

    await prisma.product.update({
      where: { id: r.productId },
      data: {
        stock: {
          increment: r.quantity
        }
      }
    })

    await prisma.inventoryReservation.delete({
      where: { id: r.id }
    })

  }

}

/*
RUN EVERY MINUTE
*/

export function startInventoryWorker() {

  setInterval(async () => {

    try {

      await releaseExpiredReservations()

    } catch (err) {

      console.error("Inventory worker error:", err)

    }

  }, 60000)

}