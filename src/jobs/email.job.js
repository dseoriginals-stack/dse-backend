import { Worker } from "bullmq"
import connection from "../config/queue.js"
import { sendInvoiceEmail, sendPasswordResetEmail } from "../config/email.js"

const emailWorker = new Worker(
  "emailQueue",
  async job => {

    const { type, payload } = job.data

    if (type === "invoice") {
      await sendInvoiceEmail(payload.email, payload.order)
    }

    if (type === "passwordReset") {
      await sendPasswordResetEmail(payload.email, payload.resetUrl)
    }

  },
  { connection }
)

emailWorker.on("completed", job => {
  console.log(`Email job completed: ${job.id}`)
})

emailWorker.on("failed", (job, err) => {
  console.error(`Email job failed: ${job.id}`, err)
})