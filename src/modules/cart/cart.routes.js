import express from "express"
import authenticate from "../../middleware/auth.middleware.js"
import * as controller from "./cart.controller.js"
import { saveCartEmail } from "./cart.controller.js"

const router = express.Router()

router.post("/save-email", saveCartEmail)

router.get("/", authenticate, controller.getCart)

router.post("/item", authenticate, controller.addItem)

router.delete("/item/:id", authenticate, controller.removeItem)

export default router