import prisma from "../../config/prisma.js"

/*
--------------------------------
GET REVIEWS
--------------------------------
*/

export async function getProductReviews(productId) {

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const total = reviews.length

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)

  const average = total === 0 ? 0 : sum / total

  /*
  ⭐ RATING BREAKDOWN
  */

  const breakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  }

  reviews.forEach(r => {
    breakdown[r.rating]++
  })

  return {
    reviews,
    total,
    average: Number(average.toFixed(1)),
    breakdown
  }

}

/*
--------------------------------
CREATE REVIEW
--------------------------------
*/

export async function createReview(userId, data) {

  const { productId, rating, comment } = data

  return prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment
    }
  })

}