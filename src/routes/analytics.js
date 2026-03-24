router.get("/analytics", requireAdmin, async (req, res) => {

  const revenueChart = await prisma.order.groupBy({
    by: ["createdAt"],
    _sum: { total: true }
  })

  const orderChart = await prisma.order.groupBy({
    by: ["createdAt"],
    _count: true
  })

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: "desc" }
    },
    take: 5
  })

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  })

  res.json({
    revenueChart,
    orderChart,
    topProducts,
    recentOrders
  })

})