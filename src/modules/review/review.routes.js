import express from "express"
import * as controller from "./review.controller.js"

import authenticate from "../../middleware/auth.middleware.js"

const router = express.Router()

router.get("/:productId", controller.getReviews)

router.post("/", authenticate, controller.createReview)

export default router