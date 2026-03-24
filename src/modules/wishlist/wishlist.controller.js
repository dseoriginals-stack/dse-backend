import prisma from "../../config/prisma.js"

/*
ADD TO WISHLIST
*/

export const addToWishlist = async (req, res, next) => {

  try {

    const userId = req.user.id
    const { productId } = req.body

    const item = await prisma.wishlist.create({
      data: {
        userId,
        productId
      }
    })

    res.json(item)

  } catch (err) {

    if (err.code === "P2002") {
      return res.status(400).json({
        message: "Product already in wishlist"
      })
    }

    next(err)

  }

}

/*
GET USER WISHLIST
*/

export const getWishlist = async (req, res, next) => {

  try {

    const userId = req.user.id

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(wishlist)

  } catch (err) {
    next(err)
  }

}

/*
REMOVE FROM WISHLIST
*/

export const removeFromWishlist = async (req, res, next) => {

  try {

    const userId = req.user.id
    const { productId } = req.params

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    res.json({
      message: "Removed from wishlist"
    })

  } catch (err) {
    next(err)
  }

}