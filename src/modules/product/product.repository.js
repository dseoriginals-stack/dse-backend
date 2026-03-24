import prisma from "../../config/prisma.js"

export const findProducts = (query) => {
  return prisma.product.findMany(query)
}

export const findBySlug = (slug) => {
  return prisma.product.findUnique({
    where: { slug }
  })
}

export const createProduct = (data) => {
  return prisma.product.create({ data })
}