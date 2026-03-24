import prisma from "../../config/prisma.js"
import generateSlug from "../../utils/slugify.js"

import { getCache, setCache } from "../../utils/cache.js"
import { getSearchCache, setSearchCache } from "../../../utils/searchCache.js"

/*
--------------------------------
GET PRODUCTS
--------------------------------
*/

export async function getProducts(query) {

  const cacheKey = `products:list:${JSON.stringify(query)}`

  const cached = await getCache(cacheKey)

  if (cached) return cached

  const {
    category,
    search,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    limit = 12
  } = query

  const pageNum = Number(page)
  const limitNum = Number(limit)

  const skip = (pageNum - 1) * limitNum

  const where = {
    status: "active"
  }

  if (category) {

    where.category = {
      slug: category
    }

  }

  if (search) {

    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: search,
          mode: "insensitive"
        }
      }
    ]

  }

  if (minPrice || maxPrice) {

    where.price = {}

    if (minPrice) where.price.gte = Number(minPrice)
    if (maxPrice) where.price.lte = Number(maxPrice)

  }

  let orderBy = { createdAt: "desc" }

  if (sort === "price_asc") orderBy = { price: "asc" }
  if (sort === "price_desc") orderBy = { price: "desc" }

  const [products, total] = await prisma.$transaction([

    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        variants: true,
        category: true
      }
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

  await setCache(cacheKey, response, 120)

  return response

}

/*
--------------------------------
GET PRODUCT BY SLUG
--------------------------------
*/

export async function getProductBySlug(slug) {

  const cacheKey = `product:slug:${slug}`

  const cached = await getCache(cacheKey)

  if (cached) return cached

  const product = await prisma.product.findUnique({

    where: { slug },

    include: {
      images: true,
      variants: {
        include: {
          attributes: true
        }
      },
      category: true,
      reviews: true
    }

  })

  if (!product) return null

  await setCache(cacheKey, product, 300)

  return product

}

/*
--------------------------------
CREATE PRODUCT
--------------------------------
*/

export async function createProduct(data) {

  const {
    name,
    description,
    categoryId,
    image
  } = data

  const slug = await generateSlug(name)

  return prisma.product.create({

    data: {

      name,
      slug,
      description,
      status: "active",
      categoryId,

      images: image
        ? {
            create: {
              url: image,
              isPrimary: true
            }
          }
        : undefined

    }

  })

}

/*
--------------------------------
UPDATE PRODUCT
--------------------------------
*/

export async function updateProduct(id, data) {

  return prisma.product.update({
    where: { id },
    data
  })

}

/*
--------------------------------
ARCHIVE PRODUCT
--------------------------------
*/

export async function deleteProduct(id) {

  return prisma.product.update({

    where: { id },

    data: {
      status: "archived"
    }

  })

}

/*
--------------------------------
SEARCH PRODUCTS
--------------------------------
*/

export async function searchProducts(query) {

  const cacheKey = `search:products:${query}`

  const cached = await getSearchCache(cacheKey)

  if (cached) return cached

  const products = await prisma.$queryRaw`

    SELECT
      p.id,
      p.name,
      p.slug,
      pi.url AS image
    FROM "Product" p
    LEFT JOIN "ProductImage" pi
      ON pi."productId" = p.id
      AND pi."isPrimary" = true
    WHERE
      p.status = 'active'
      AND to_tsvector('english', p.name || ' ' || COALESCE(p.description,'')) @@ plainto_tsquery('english', ${query})
    LIMIT 20
  `

  await setSearchCache(cacheKey, products, 120)

  return products

}

/*
--------------------------------
AUTOCOMPLETE
--------------------------------
*/

export async function autocompleteProducts(query) {

  const cacheKey = `search:autocomplete:${query}`

  const cached = await getSearchCache(cacheKey)

  if (cached) return cached

  const products = await prisma.product.findMany({

    where: {
      name: {
        startsWith: query,
        mode: "insensitive"
      },
      status: "active"
    },

    select: {
      id: true,
      name: true,
      slug: true
    },

    take: 8

  })

  await setSearchCache(cacheKey, products, 300)

  return products

}