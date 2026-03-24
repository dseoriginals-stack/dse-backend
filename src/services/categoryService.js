import prisma from "../config/prisma.js"

export async function getCategories() {

  return prisma.category.findMany({
    orderBy: { name: "asc" }
  })

}

export async function createCategory(data) {

  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")

  return prisma.category.create({
    data: {
      name: data.name,
      slug
    }
  })

}

export async function deleteCategory(id) {

  return prisma.category.delete({
    where: { id }
  })

}