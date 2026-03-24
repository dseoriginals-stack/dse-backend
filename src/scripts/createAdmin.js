const prisma = require("../config/prisma")

async function createAdmin() {
  await prisma.user.create({
    data: {
      id: "manual-admin-id",
      email: "dseoriginals@gmail.com",
      role: "admin",
      luckyPoints: 10000
    }
  })

  console.log("Admin created")
}

createAdmin()