import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {

  /*
  Create Categories
  */

  const perfume = await prisma.category.upsert({
    where: { id: "perfume" },
    update: {},
    create: {
      id: "perfume",
      name: "Perfume",
      slug: "perfume"
    }
  })

  const apparel = await prisma.category.upsert({
    where: { id: "apparel" },
    update: {},
    create: {
      id: "apparel",
      name: "Apparel",
      slug: "apparel"
    }
  })

  const dse = await prisma.category.upsert({
    where: { id: "dse" },
    update: {},
    create: {
      id: "dse",
      name: "DSE Collection",
      slug: "dse"
    }
  })

  /*
  Create Products
  */

  await prisma.product.createMany({

    data: [

      {
        id: "prod1",
        name: "DSE Noir",
        slug: "dse-noir",
        description: "Luxury signature perfume",
        price: 1200,
        stock: 20,
        image: "/products/perfume1.jpg",
        categoryId: perfume.id
      },

      {
        id: "prod2",
        name: "DSE Hoodie",
        slug: "dse-hoodie",
        description: "Premium streetwear hoodie",
        price: 2400,
        stock: 15,
        image: "/products/hoodie.jpg",
        categoryId: apparel.id
      },

      {
        id: "prod3",
        name: "DSE Limited Shirt",
        slug: "dse-limited-shirt",
        description: "Limited edition collection",
        price: 1800,
        stock: 10,
        image: "/products/shirt.jpg",
        categoryId: dse.id
      }

    ],

    skipDuplicates: true

  })

  console.log("Database seeded successfully")

}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })