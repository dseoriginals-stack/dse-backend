import prisma from "../../config/prisma.js"

/*
-----------------------------------
GET ANALYTICS
-----------------------------------
*/

export const getAnalytics = async (req, res) => {
  try {

    const [revenue, orders, products, topProducts] = await Promise.all([

      // 💰 TOTAL REVENUE
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "paid" }
      }),

      // 📦 ORDER COUNT
      prisma.order.count({
        where: { status: "paid" }
      }),

      // 📦 TOTAL PRODUCTS
      prisma.product.count(),

      // 🥇 TOP PRODUCTS
      prisma.orderItem.groupBy({
        by: ["productName"],
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: "desc"
          }
        },
        take: 5
      })

    ])

    /*
    -----------------------------------
    SALES LAST 7 DAYS
    -----------------------------------
    */

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d
    }).reverse()

    const sales = await Promise.all(
      last7Days.map(async (date) => {

        const start = new Date(date)
        start.setHours(0,0,0,0)

        const end = new Date(date)
        end.setHours(23,59,59,999)

        const result = await prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: "paid",
            createdAt: {
              gte: start,
              lte: end
            }
          }
        })

        return {
          date: start.toISOString().slice(5,10),
          total: Number(result._sum.total || 0)
        }

      })
    )

    return res.json({
      revenue: Number(revenue._sum.total || 0),
      orders,
      products,
      topProducts,
      sales
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}