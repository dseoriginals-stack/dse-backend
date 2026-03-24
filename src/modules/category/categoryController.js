import * as categoryService from "../../services/categoryService.js"

export async function getCategories(req, res) {

  try {

    const categories = await categoryService.getCategories()

    res.json(categories)

  } catch {

    res.status(500).json({ message: "Failed to fetch categories" })

  }

}

export async function createCategory(req, res) {

  try {

    const category = await categoryService.createCategory(req.body)

    res.json(category)

  } catch {

    res.status(400).json({ message: "Failed to create category" })

  }

}

export async function deleteCategory(req, res) {

  try {

    await categoryService.deleteCategory(req.params.id)

    res.json({ success: true })

  } catch {

    res.status(400).json({ message: "Failed to delete category" })

  }

}