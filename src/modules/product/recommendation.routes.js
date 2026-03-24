import express from "express"
import * as controller from "./recommendation.controller.js"

const router = express.Router()

router.get("/related/:productId", controller.getRelatedProducts)
router.get("/trending", controller.getTrendingProducts)
router.get("/together/:productId", controller.getFrequentlyBoughtTogether)

export default router