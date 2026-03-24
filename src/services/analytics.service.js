exports.getDashboardStats = async () => {

  const totalOrders = await prisma.order.count()

  const revenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: "paid" }
  })

  const totalProducts = await prisma.product.count()

  return {
    totalOrders,
    revenue: revenue._sum.total || 0,
    totalProducts
  }
}