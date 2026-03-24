import prisma from "../config/prisma.js"
import xendit from "../config/xendit.js"
import logger from "../config/logger.js"

export async function recoverPayments() {

  try {

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "pending",
        paymentId: { not: null }
      }
    })

    for (const order of pendingOrders) {

      try {

        const invoice = await xendit.Invoice.getInvoice({
          invoiceId: order.paymentId
        })

        if (invoice.status === "PAID") {

          await prisma.order.update({
            where: { id: order.id },
            data: { status: "paid" }
          })

          logger.info("Recovered missed payment", {
            orderId: order.id
          })

        }

      } catch (err) {

        logger.warn("Payment recovery check failed", {
          orderId: order.id
        })

      }

    }

  } catch (err) {

    logger.error("Payment recovery job failed", { error: err })

  }

}