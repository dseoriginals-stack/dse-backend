import express from "express"
import authenticate from "../../middleware/auth.middleware.js"

import {
  getMe,
  updateProfile,
  getMyOrders,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from "./user.controller.js"

const router = express.Router()

router.use(authenticate)

/* PROFILE */
router.get("/me", getMe)
router.patch("/me", updateProfile)

/* ORDERS */
router.get("/me/orders", getMyOrders)

/* ADDRESSES */
router.get("/me/addresses", getAddresses)
router.post("/me/addresses", createAddress)
router.patch("/me/addresses/:id", updateAddress)
router.delete("/me/addresses/:id", deleteAddress)

export default router