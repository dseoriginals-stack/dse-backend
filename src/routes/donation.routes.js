import express from "express"
import { createDonation } from "../controllers/donation.controller.js"

const router = express.Router()

router.post("/", createDonation)

export default router