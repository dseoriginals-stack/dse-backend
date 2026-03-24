import express from "express"

import {
  getCategories,
  createCategory,
  deleteCategory
} from "../modules/category/categoryController.js"

import requireAdmin from "../middleware/requireAdmin.js"

const router = express.Router()

router.get("/", getCategories)

router.post("/", requireAdmin, createCategory)

router.delete("/:id", requireAdmin, deleteCategory)

export default router