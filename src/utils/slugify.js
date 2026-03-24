import slugify from "slugify"
import prisma from "../config/prisma.js"

async function generateSlug(name) {

  let slug = slugify(name, {
    lower: true,
    strict: true
  })

  let existing = await prisma.product.findUnique({
    where: { slug }
  })

  if (!existing) return slug

  let counter = 1

  while (existing) {

    const newSlug = `${slug}-${counter}`

    existing = await prisma.product.findUnique({
      where: { slug: newSlug }
    })

    if (!existing) return newSlug

    counter++
  }

}

export default generateSlug