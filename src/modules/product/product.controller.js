import prisma from "../../config/prisma.js"
import { z } from "zod"
import generateSlug from "../../utils/slugify.js"
import { Prisma } from "@prisma/client"

import {
  getCache,
  setCache,
  deleteCache
} from "../../utils/searchCache.js"

/* ================================
   PRODUCT SCHEMA
================================ */

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  categoryId: z.string(),
  stock: z.coerce.number().int().nonnegative()
})

/* ================================
   CREATE PRODUCT
================================ */

export const createProduct = async (req, res, next) => {
  try {
    const validation = productSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error?.errors?.[0]?.message || "Invalid input"
      })
    }

    const { name, price, stock, categoryId, description } = validation.data

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return res.status(400).json({
        message: "Category does not exist"
      })
    }

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : null

    const slug = await generateSlug(name)

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        status: "active",

        category: {
          connect: { id: categoryId }
        },

        ...(image && {
          images: {
            create: [{ url: image, isPrimary: true }]
          }
        }),

        variants: {
          create: [
            {
              sku: `SKU-${Date.now()}`,
              name: "Default",
              price: new Prisma.Decimal(price),
              stock
            }
          ]
        }
      },
      include: {
        images: true,
        variants: true,
        category: true
      }
    })

    await deleteCache("products:*")

    res.status(201).json(product)

  } catch (err) {
    console.error("❌ CREATE PRODUCT ERROR:", err)
    next(err)
  }
}

/* ================================
   GET PRODUCTS
================================ */

export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const cacheKey = `products:${JSON.stringify(req.query)}`
    const cached = await getCache(cacheKey)
    if (cached) return res.json(cached)

    const where = {
      status: "active",

      ...(category && { categoryId: category }),

      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      }),

      ...(minPrice || maxPrice
        ? {
            variants: {
              some: {
                price: {
                  ...(minPrice && { gte: new Prisma.Decimal(minPrice) }),
                  ...(maxPrice && { lte: new Prisma.Decimal(maxPrice) })
                }
              }
            }
          }
        : {})
    }

    let orderBy = { createdAt: "desc" }

    if (sort === "price_asc") {
      orderBy = {
        variants: { _min: { price: "asc" } }
      }
    }

    if (sort === "price_desc") {
      orderBy = {
        variants: { _max: { price: "desc" } }
      }
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          variants: true,
          category: true
        },
        skip,
        take: limitNum,
        orderBy
      }),
      prisma.product.count({ where })
    ])

    const response = {
      data: products,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    }

    await setCache(cacheKey, response, 60)

    res.json(response)

  } catch (err) {
    console.error("❌ GET PRODUCTS ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}

/* ================================
   GET PRODUCT BY SLUG
================================ */

export const getProductBySlugController = async (req, res) => {
  try {
    const { slug } = req.params

    const cacheKey = `product:${slug}`
    const cached = await getCache(cacheKey)
    if (cached) return res.json(cached)

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        variants: {
          include: { attributes: true }
        },
        category: true
      }
    })

    if (!product || product.status !== "active") {
      return res.status(404).json({ message: "Product not found" })
    }

    await setCache(cacheKey, product, 120)

    res.json(product)

  } catch (err) {
    console.error("❌ GET PRODUCT BY SLUG ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}

/* ================================
   GET PRODUCT BY ID
================================ */

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        category: true
      }
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)

  } catch (err) {
    console.error("❌ GET PRODUCT ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}

/* ================================
   RELATED PRODUCTS (ADDED FIX)
================================ */

export const getRelatedProductsController = async (req, res) => {
  try {
    const { productId, categoryId } = req.query

    if (!categoryId) {
      return res.status(400).json({
        message: "categoryId is required"
      })
    }

    const products = await prisma.product.findMany({
      where: {
        status: "active",
        categoryId,
        ...(productId && { NOT: { id: productId } })
      },
      include: {
        images: true,
        variants: true
      },
      take: 4
    })

    res.json(products)

  } catch (err) {
    console.error("❌ RELATED PRODUCTS ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}

/* ================================
   UPDATE PRODUCT
================================ */

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    const updateData = { ...req.body }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    })

    await deleteCache("products:*")
    await deleteCache("product:*")

    res.json(updated)

  } catch (err) {
    console.error("❌ UPDATE PRODUCT ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}

/* ================================
   DELETE PRODUCT
================================ */

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.product.update({
      where: { id },
      data: { status: "archived" }
    })

    await deleteCache("products:*")
    await deleteCache("product:*")

    res.json({ message: "Product disabled" })

  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err)
    res.status(500).json({ error: err.message })
  }
}