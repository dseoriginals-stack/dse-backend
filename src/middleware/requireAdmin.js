import jwt from "jsonwebtoken"

export default function requireAdmin(req, res, next) {

  const auth = req.headers.authorization

  if (!auth) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const token = auth.split(" ")[1]

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" })
    }

    req.user = decoded

    next()

  } catch {

    return res.status(401).json({ message: "Invalid token" })

  }

}