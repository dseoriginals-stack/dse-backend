import prisma from "../../config/prisma.js"
import xendit from "../../config/xendit.js"
import PDFDocument from "pdfkit"
import logger from "../../config/logger.js"
import { canTransition } from "../../utils/orderState.js"
import { sendShippedEmail } from "../../services/email.service.js"
import {
  reserveStock,
  releaseReservation
} from "../inventory/inventoryService.js"
import { createOrderEvent } from "../../services/orderEvent.service.js"

/* ============================
CREATE ORDER
============================ */

export const createOrder = async (req, res, next) => {

  let order = null

  try {

    const {
      items,
      shippingAddr,
      address,
      guestEmail,
      guestName,
      clientOrderId
    } = req.body

    const userId = req.user?.id || null

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No items provided"
      })
    }

    if (!address) {
      return res.status(400).json({
        message: "Address is required"
      })
    }

    /*
    ---------------------------
    IDEMPOTENCY
    ---------------------------
    */

    if (clientOrderId) {

      const existing = await prisma.order.findUnique({
        where: { clientOrderId }
      })

      if (existing) {
        return res.json({
          orderId: existing.id,
          invoiceUrl: existing.invoiceUrl || null
        })
      }

    }

    /*
    ---------------------------
    CREATE ORDER (TX)
    ---------------------------
    */

    order = await prisma.$transaction(async (tx) => {

      let total = 0
      const orderItems = []

      for (const item of items) {

        const variant = await tx.productVariant.findUnique({
          where: { id: item.productId },
          include: { product: true }
        })

        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${variant?.product?.name}`)
        }

        const itemTotal = Number(variant.price) * item.quantity
        total += itemTotal

        orderItems.push({
          variantId: variant.id,
          productName: variant.product.name,
          quantity: item.quantity,
          price: variant.price
        })
      }

      return tx.order.create({
        data: {
          userId,
          guestEmail: userId ? null : guestEmail,
          guestName: userId ? null : guestName,
          shippingAddr,
          total,
          clientOrderId,
          status: "pending",

          items: {
            create: orderItems
          },

          address: {
            create: {
              fullName: address.fullName,
              phone: address.phone,
              region: address.region,
              province: address.province,
              city: address.city,
              barangay: address.barangay,
              street: address.street,
              postalCode: address.postalCode || null
            }
          }
        },
        include: {
          items: true,
          address: true
        }
      })

    })

    logger.info("Order created", { orderId: order.id })

    /*
    ---------------------------
    SAVE USER INFO + ADDRESS
    ---------------------------
    */

    if (userId && address) {

      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(guestName && { name: guestName }),
          ...(address.phone && { phone: address.phone })
        }
      })

      // ✅ FIX: ensure only one default address
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })

      await prisma.address.create({
        data: {
          userId,
          label: "Default",
          fullName: address.fullName,
          phone: address.phone,
          region: address.region,
          province: address.province,
          city: address.city,
          barangay: address.barangay,
          street: address.street,
          postalCode: address.postalCode || null,
          isDefault: true
        }
      })
    }

    await createOrderEvent(order.id, "created", "Order created")

    /*
    ---------------------------
    RESERVE STOCK
    ---------------------------
    */

    await reserveStock(items, order.id)

    /*
    ---------------------------
    CREATE XENDIT INVOICE
    ---------------------------
    */

    const email =
      req.user?.email ||
      guestEmail ||
      "customer@example.com"

    const invoice = await xendit.Invoice.createInvoice({
      externalId: order.id,
      amount: Number(order.total),
      payerEmail: email,
      description: `DSE Order #${order.id}`,

      successRedirectUrl: `${process.env.CLIENT_URL}/order-success/${order.id}`,
      failureRedirectUrl: `${process.env.CLIENT_URL}/checkout`,

      metadata: {
        orderId: order.id,
        customer: guestName || req.user?.email,
        items: items.length
      }
    })

    /*
    ---------------------------
    SAVE PAYMENT DATA
    ---------------------------
    */

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: invoice.id
      }
    })

    return res.json({
      orderId: order.id,
      invoiceUrl: invoice.invoiceUrl
    })

  } catch (err) {

    logger.error("Order creation failed", {
      error: err.message,
      orderId: order?.id
    })

    if (order?.id) {
      await releaseReservation(order.id)
    }

    next(err)

  }
}

/* ============================
GET ALL ORDERS
============================ */

export const getAllOrders = async (req, res, next) => {
  try {

    const { status } = req.query

    const orders = await prisma.order.findMany({
      where: {
        ...(status && { status })
      },
      include: {
        items: true,
        user: true,
        address: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(orders)

  } catch (err) {
    logger.error("Fetch all orders failed", { error: err })
    next(err)
  }
}

/* ============================
GET SINGLE ORDER
============================ */

export const getSingleOrder = async (req, res, next) => {
  try {

    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        address: true
      }
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (
      req.user.role === "admin" ||
      req.user.role === "staff"
    ) {
      return res.json(order)
    }

    if (!order.userId || order.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" })
    }

    res.json(order)

  } catch (err) {
    logger.error("Fetch single order failed", { error: err })
    next(err)
  }
}

/* ============================
UPDATE ORDER STATUS
============================ */

export const updateOrderStatus = async (req, res, next) => {
  try {

    const { id } = req.params
    const { status, trackingNo } = req.body

    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (!canTransition(order.status, status)) {
      return res.status(400).json({
        message: `Invalid transition from ${order.status} → ${status}`
      })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingNo && { trackingNo })
      }
    })

    await createOrderEvent(id, status, `Order → ${status}`)

    if (status === "shipped") {

      const fullOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true, user: true }
      })

      await sendShippedEmail(
        fullOrder.user?.email || fullOrder.guestEmail,
        fullOrder
      )
    }

    res.json(updated)

  } catch (err) {
    next(err)
  }
}

/* ============================
REFUND ORDER
============================ */

export const refundOrder = async (req, res, next) => {
  try {

    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!order || order.status !== "paid") {
      return res.status(400).json({
        message: "Refund not allowed"
      })
    }

    await prisma.$transaction(async (tx) => {

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity }
          }
        })
      }

      await tx.order.update({
        where: { id },
        data: { status: "refunded" }
      })
    })

    await createOrderEvent(id, "refunded", "Order refunded")

    logger.info("Order refunded", { orderId: id })

    res.json({ message: "Order refunded" })

  } catch (err) {
    logger.error("Refund failed", { error: err })
    next(err)
  }
}

/* ============================
GENERATE INVOICE
============================ */

export const generateInvoice = async (req, res, next) => {
  try {

    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, address: true }
    })

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      })
    }

    const doc = new PDFDocument()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${id}.pdf`
    )

    doc.pipe(res)

    doc.fontSize(20).text("Invoice", { align: "center" })
    doc.moveDown()

    doc.text(`Order ID: ${order.id}`)
    doc.text(`Status: ${order.status}`)
    doc.text(`Total: ₱${order.total}`)
    doc.moveDown()

    if (order.address) {
      doc.text("Shipping Address:")
      doc.text(`${order.address.fullName}`)
      doc.text(`${order.address.phone}`)
      doc.text(`${order.address.street}, ${order.address.barangay}`)
      doc.text(`${order.address.city}, ${order.address.province}`)
      doc.text(`${order.address.region}`)
      doc.moveDown()
    }

    order.items.forEach(item => {
      doc.text(
        `Product: ${item.productName} | Qty: ${item.quantity} | ₱${item.price}`
      )
    })

    doc.end()

  } catch (err) {
    logger.error("Generate invoice failed", { error: err })
    next(err)
  }
}