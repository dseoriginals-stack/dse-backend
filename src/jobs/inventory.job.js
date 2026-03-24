import { Worker } from "bullmq"
import connection from "../config/queue.js"
import prisma from "../config/prisma.js"

const inventoryWorker = new Worker(
  "orderQueue",
  async job => {

    if (job.name === "releaseExpiredReservations") {

      const expired = await prisma.inventoryReservation.findMany({
        where: {
          status: "reserved",
          expiresAt: {
            lt: new Date()
          }
        }
      })

      for (const r of expired) {

        await prisma.product.update({
          where: { id: r.productId },
          data: {
            stock: {
              increment: r.quantity
            }
          }
        })

        await prisma.inventoryReservation.update({
          where: { id: r.id },
          data: { status: "released" }
        })

      }

    }

  },
  { connection }
)