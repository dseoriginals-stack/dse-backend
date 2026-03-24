const prisma = require("../config/prisma")

module.exports = async function cleanupReservations() {

  const expired = await prisma.inventoryReservation.findMany({
    where: {
      status: "reserved",
      expiresAt: {
        lt: new Date()
      }
    }
  })

  for (const r of expired) {

    await prisma.inventoryReservation.update({
      where: { id: r.id },
      data: { status: "expired" }
    })

  }

}