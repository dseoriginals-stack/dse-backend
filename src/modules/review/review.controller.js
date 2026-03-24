import * as service from "./review.service.js"

/*
--------------------------------
GET REVIEWS
--------------------------------
*/

export const getReviews = async (req, res, next) => {

  try {

    const { productId } = req.params

    const data = await service.getProductReviews(productId)

    res.json(data)

  } catch (err) {
    next(err)
  }

}

/*
--------------------------------
CREATE REVIEW
--------------------------------
*/

export const createReview = async (req, res, next) => {

  try {

    const userId = req.user.id

    const review = await service.createReview(userId, req.body)

    res.json(review)

  } catch (err) {

    if (err.code === "P2002") {
      return res.status(400).json({
        message: "You already reviewed this product"
      })
    }

    next(err)

  }

}