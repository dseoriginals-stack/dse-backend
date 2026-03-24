const { z } = require("zod")

exports.createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0)
    })
  ).min(1),
  shippingAddr: z.string().min(5),
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(2).optional()
})