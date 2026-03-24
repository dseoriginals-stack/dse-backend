import prisma from "../config/prisma.js"
import { sendAbandonedCartEmail } from "../services/email.service.js"
import { generateToken } from "../utils/generateToken.js"

export const handleAbandonedCarts = async () => {

  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 2)

  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: { lt: cutoff },
      items: { some: {} },
      email: { not: null }
    },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  })

  for (const cart of carts) {

    try {

      // 🔥 create recovery token
      const token = generateToken()

      await prisma.cartRecovery.create({
        data: {
          cartId: cart.id,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
        }
      })

      const recoveryUrl = `${process.env.CLIENT_URL}/recover-cart?token=${token}`

      await sendAbandonedCartEmail(cart.email, cart, recoveryUrl)

      console.log("Recovery email sent:", cart.email)

    } catch (err) {
      console.error("Recovery failed:", err.message)
    }

  }

}