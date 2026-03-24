import prisma from "../../config/prisma.js"

/* ============================
GET USER CART
============================ */

export const getCart = async (req, res, next) => {

  try {

    const userId = req.user.id

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    res.json(cart || { items: [] })

  } catch (err) {
    next(err)
  }

}

/* ============================
ADD ITEM
============================ */

export const addItem = async (req, res, next) => {

  try {

    const userId = req.user.id
    const { variantId, quantity } = req.body // ✅ FIXED

    let cart = await prisma.cart.findFirst({
      where: { userId }
    })

    if (!cart) {

      cart = await prisma.cart.create({
        data: { userId }
      })

    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId // ✅ FIXED
      }
    })

    if (existing) {

      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity
        }
      })

    } else {

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId, // ✅ FIXED
          quantity
        }
      })

    }

    res.json({ success: true })

  } catch (err) {
    next(err)
  }

}

/* ============================
REMOVE ITEM
============================ */

export const removeItem = async (req, res, next) => {

  try {

    const { id } = req.params

    await prisma.cartItem.delete({
      where: { id }
    })

    res.json({ success: true })

  } catch (err) {
    next(err)
  }

}

/* ============================
SAVE EMAIL (🔥 REQUIRED FOR RECOVERY)
============================ */

export const saveCartEmail = async (req, res, next) => {

  try {

    const userId = req.user?.id
    const { email } = req.body

    let cart = null

    if (userId) {

      cart = await prisma.cart.findFirst({
        where: { userId }
      })

    }

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      })
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { email }
    })

    res.json({ success: true })

  } catch (err) {
    next(err)
  }

}