import express from "express"

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductBySlugController
} from "./product.controller.js"

const router = express.Router()

/* =========================
   PUBLIC
========================= */

router.get("/", getProducts)
router.get("/slug/:slug", getProductBySlugController)
router.get("/:id", getProduct)

/* =========================
   ADMIN
========================= */

router.post("/", createProduct)
router.put("/:id", updateProduct)
router.delete("/:id", deleteProduct)

export default router