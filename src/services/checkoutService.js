import prisma from "../config/prisma.js"
import { reserveStock } from "./inventoryService.js"

export async function createCheckout(cartItems, userId) {

  const reservations = []

  let total = 0

  for (const item of cartItems) {

    const reservation = await reserveStock(
      item.productId,
      item.quantity
    )

    reservations.push(reservation)

    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    })

    total += product.price * item.quantity

  }

  const order = await prisma.order.create({
    data: {
      total,
      status: "pending",
      userId
    }
  })

  return {
    order,
    reservations
  }

}