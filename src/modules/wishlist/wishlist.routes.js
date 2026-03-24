import express from "express"
import authenticate from "../../middleware/auth.middleware.js"
import * as controller from "./wishlist.controller.js"

const router = express.Router()

router.get("/", authenticate, controller.getWishlist)

router.post("/", authenticate, controller.addToWishlist)

router.delete("/:productId", authenticate, controller.removeFromWishlist)

export default router