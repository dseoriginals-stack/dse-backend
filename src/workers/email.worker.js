const { Worker } = require("bullmq")
const connection = require("../config/redis")

new Worker("email", async job => {

  const { email, orderId } = job.data

  // send email

}, { connection })