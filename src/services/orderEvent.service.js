import prisma from "../config/prisma.js"

export async function createOrderEvent(orderId, type, message) {

  return prisma.orderEvent.create({
    data: {
      orderId,
      type,
      message
    }
  })

}