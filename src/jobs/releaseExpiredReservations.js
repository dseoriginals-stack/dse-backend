import prisma from "../config/prisma.js"

export async function releaseExpiredReservations() {

  const expired = await prisma.inventoryReservation.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: "reserved"
    }
  })

  for (const reservation of expired) {

    await prisma.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "expired" }
    })

  }

}