import prisma from "../config/prisma.js"

export async function recordInventoryMovement({
  productId,
  change,
  type,
  orderId = null,
  reason = null
}) {

  return prisma.inventoryMovement.create({
    data: {
      productId,
      change,
      type,
      orderId,
      reason
    }
  })

}