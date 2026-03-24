const prisma = require("../../config/prisma")

exports.getDashboardStats = async (req, res) => {
  const totalSales = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: "paid" }
  })

  const totalOrders = await prisma.order.count()
  const totalProducts = await prisma.product.count()

  res.json({
    totalSales: totalSales._sum.total || 0,
    totalOrders,
    totalProducts
  })
}