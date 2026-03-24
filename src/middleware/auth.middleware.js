import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js"

export default async function authenticate(req, res, next) {
  try {
    const token = req.cookies.accessToken

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    )

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    }

    next()

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}