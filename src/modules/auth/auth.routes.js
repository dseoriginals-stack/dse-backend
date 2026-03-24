import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import passport from "passport"

import prisma from "../../config/prisma.js"
import authLimiter from "../../middleware/authRateLimiter.js"
import { loginSchema, registerSchema } from "../../validators/auth.validator.js"
import logger from "../../config/logger.js"
import { sendPasswordResetEmail } from "../../config/email.js"

const router = express.Router()

console.log("AUTH ROUTES FILE EXECUTED")
logger.info("AUTH ROUTES LOADED")

/* =============================
   TOKEN GENERATORS
============================= */

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  )
}

/* =============================
   ISSUE TOKENS
============================= */

async function issueTokens(user, req, res) {

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex")

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashedToken,
      userId: user.id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: false, // ✅ localhost
  sameSite: "lax", // ✅ IMPORTANT (not none)
  path: "/", // ✅ REQUIRED
})

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/", // ✅ REQUIRED
})

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      luckyPoints: user.luckyPoints,
      createdAt: user.createdAt
    }
  })
}

/* =============================
   REGISTER
============================= */

router.post("/register", authLimiter, async (req, res) => {

  const validation = registerSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors[0].message
    })
  }

  try {

    const { name, email, password } = req.body

    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return res.status(400).json({
        message: "Email already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "customer",
        luckyPoints: 0
      }
    })

    return await issueTokens(user, req, res)

  } catch (err) {

    logger.error("REGISTER ERROR:", err)

    return res.status(500).json({
      message: "Registration failed"
    })

  }

})

/* =============================
   LOGIN
============================= */

router.post("/login", authLimiter, async (req, res) => {

  try {

    const validation = loginSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message
      })
    }

    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      })
    }

    return await issueTokens(user, req, res)

  } catch (error) {

    logger.error("LOGIN ERROR:", error)

    return res.status(500).json({
      message: "Login failed"
    })

  }

})

/* =============================
   GOOGLE OAUTH
============================= */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
)

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {

    const user = req.user

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    })

    res.redirect("http://localhost:3000")

  }
)

/* =============================
   FORGOT PASSWORD
============================= */

router.post("/forgot-password", async (req, res) => {

  const { email } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return res.json({
      message: "If email exists, reset link sent"
    })
  }

  const token = crypto.randomBytes(32).toString("hex")

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: hashedToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  })

  const resetUrl = `http://localhost:3000/reset-password?token=${token}`

  await sendPasswordResetEmail(email, resetUrl)

  logger.info("Password reset email sent", { email })

  return res.json({
    message: "Reset link sent"
  })

})

/* =============================
   RESET PASSWORD
============================= */

router.post("/reset-password", async (req, res) => {

  const { token, password } = req.body

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")

  const reset = await prisma.passwordReset.findFirst({
    where: {
      tokenHash: hashedToken,
      expiresAt: { gt: new Date() }
    }
  })

  if (!reset) {
    return res.status(400).json({
      message: "Invalid or expired token"
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: reset.userId },
    data: { password: hashedPassword }
  })

  await prisma.passwordReset.delete({
    where: { id: reset.id }
  })

  return res.json({
    message: "Password reset successful"
  })

})

/* =============================
   LOGOUT
============================= */

router.post("/logout", async (req, res) => {

  try {

    const refreshToken = req.cookies.refreshToken

    if (refreshToken) {

      const hashedToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex")

      await prisma.refreshToken.deleteMany({
        where: { tokenHash: hashedToken }
      })

    }

    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")

    return res.json({ message: "Logged out" })

  } catch (error) {

    logger.error("LOGOUT ERROR:", error)

    return res.status(500).json({
      message: "Logout failed"
    })

  }

})

/* =============================
   AUTH SYNC
============================= */

router.get("/sync", async (req, res) => {

  try {

    const token = req.cookies.accessToken

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    )

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        luckyPoints: user.luckyPoints,
        createdAt: user.createdAt
      }
    })

  } catch {

    return res.status(401).json({
      message: "Invalid or expired token"
    })

  }

})

/* =============================
   REFRESH ACCESS TOKEN
============================= */

router.post("/refresh", async (req, res) => {

  try {

    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token"
      })
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    )

    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex")

    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashedToken,
        userId: decoded.id,
        expiresAt: { gt: new Date() }
      }
    })

    if (!stored) {
      return res.status(401).json({
        message: "Refresh token revoked"
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    const accessToken = generateAccessToken(user)

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000
    })

    return res.json({
      message: "Token refreshed"
    })

  } catch (error) {

    logger.error("REFRESH TOKEN ERROR:", error)

    return res.status(500).json({
      message: "Token refresh failed"
    })

  }

})

/* =============================
   TEST ROUTE
============================= */

router.get("/refresh-test", (req, res) => {
  res.json({ message: "Refresh route is reachable" })
})

/* =============================
   FACEBOOK OAUTH
============================= */

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"]
  })
)

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  async (req, res) => {

    const user = req.user

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    })

    res.redirect("http://localhost:3000")

  }
)
/* =============================
   VERIFY ROLE (FOR MIDDLEWARE)
============================= */

router.get("/verify-role", async (req, res) => {

  try {

    const token = req.cookies.accessToken

    if (!token) {
      return res.status(401).json({
        message: "No token"
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    )

    return res.json({
      role: decoded.role
    })

  } catch (err) {

    console.error("VERIFY ROLE ERROR:", err)

    return res.status(401).json({
      message: "Invalid or expired token"
    })

  }

})

export default router