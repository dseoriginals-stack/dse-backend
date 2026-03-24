import cron from "node-cron"
import logger from "../config/logger.js"

import { expireUnpaidOrders } from "./expireOrders.job.js"
import { reconcileInventory } from "./inventoryReconcile.job.js"
import { recoverPayments } from "./paymentRecovery.job.js"

cron.schedule("* * * * *", async () => {

  logger.info("Running order expiration job")

  await expireUnpaidOrders()

})

cron.schedule("*/10 * * * *", async () => {

  logger.info("Running payment recovery job")

  await recoverPayments()

})

cron.schedule("0 * * * *", async () => {

  logger.info("Running inventory reconciliation")

  await reconcileInventory()

})