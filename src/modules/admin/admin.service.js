import prisma from "../../config/prisma.js"

const getAdminStats = async () => {
  const users = await prisma.user.count()

  const orders = await prisma.order.count()

  const revenue = await prisma.order.aggregate({
    _sum: {
      total: true
    },
    where: {
      status: "paid"
    }
  })

  const products = await prisma.product.count()

  return {
    users,
    orders,
    products,
    revenue: revenue._sum.total || 0
  }
}

const getOrders = async () => {
  return prisma.order.findMany({
    include: {
      items: true,
      user: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

const updateOrderStatus = async (id, status, trackingNo) => {
  return prisma.order.update({
    where: { id },
    data: {
      status,
      trackingNo
    }
  })
}

const getProducts = async () => {
  return prisma.product.findMany({
    orderBy: {
      createdAt: "desc"
    }
  })
}

const getUsers = async () => {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    }
  })
}

const getStories = async () => {
  return prisma.story.findMany({
    orderBy: {
      createdAt: "desc"
    }
  })
}

export default {
  getAdminStats,
  getOrders,
  updateOrderStatus,
  getProducts,
  getUsers,
  getStories
}