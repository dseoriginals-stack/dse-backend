const { Queue } = require("bullmq")
const connection = require("../config/redis")

const emailQueue = new Queue("email", { connection })

await emailQueue.add("send-invoice", {
  email,
  orderId
})

module.exports = emailQueue