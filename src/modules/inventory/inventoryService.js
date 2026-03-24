import prisma from "../../config/prisma.js"

/*
================================
RESERVE STOCK
================================
*/

export async function reserveStock(items, orderId) {

  return await prisma.$transaction(async (tx) => {

    const reservations = []

    for (const item of items) {

      const product = await tx.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        throw new Error("Product not found")
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }

      const reservation = await tx.inventoryReservation.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          orderId,
          status: "reserved",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      })

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })

      reservations.push(reservation)

    }

    return reservations

  })

}

/*
================================
CONFIRM RESERVATIONS
================================
*/

export async function confirmReservation(orderId) {

  await prisma.inventoryReservation.updateMany({
    where: {
      orderId,
      status: "reserved"
    },
    data: {
      status: "confirmed"
    }
  })

  return true

}

/*
================================
RELEASE RESERVATIONS
================================
*/

export async function releaseReservation(orderId) {

  const reservations = await prisma.inventoryReservation.findMany({
    where: {
      orderId,
      status: "reserved"
    }
  })

  await prisma.$transaction(async (tx) => {

    for (const reservation of reservations) {

      await tx.product.update({
        where: { id: reservation.productId },
        data: {
          stock: {
            increment: reservation.quantity
          }
        }
      })

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: {
          status: "released"
        }
      })

    }

  })

}