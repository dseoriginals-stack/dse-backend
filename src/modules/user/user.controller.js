import prisma from "../../config/prisma.js"

/* ============================
GET PROFILE
============================ */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    })

    res.json(user)
  } catch (err) {
    next(err)
  }
}

/* ============================
UPDATE PROFILE
============================ */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      }
    })

    res.json(user)
  } catch (err) {
    next(err)
  }
}

/* ============================
GET USER ORDERS
============================ */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        items: true,
        address: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(orders)
  } catch (err) {
    next(err)
  }
}

/* ============================
GET ADDRESSES
============================ */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(addresses)
  } catch (err) {
    next(err)
  }
}

/* ============================
CREATE ADDRESS
============================ */
export const createAddress = async (req, res, next) => {
  try {
    const data = req.body

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        userId: req.user.id
      }
    })

    res.json(address)
  } catch (err) {
    next(err)
  }
}

/* ============================
UPDATE ADDRESS
============================ */
export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data
    })

    res.json(address)
  } catch (err) {
    next(err)
  }
}

/* ============================
DELETE ADDRESS
============================ */
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.address.delete({
      where: { id }
    })

    res.json({ message: "Address deleted" })
  } catch (err) {
    next(err)
  }
}