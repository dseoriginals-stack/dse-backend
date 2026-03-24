import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { Strategy as FacebookStrategy } from "passport-facebook"

import prisma from "./prisma.js"
import logger from "./logger.js"

/* =============================
   GOOGLE STRATEGY
============================= */

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },

      async (accessToken, refreshToken, profile, done) => {

        try {

          const email = profile.emails?.[0]?.value

          if (!email) {
            return done(new Error("Google account has no email"), null)
          }

          let user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {

            user = await prisma.user.create({
              data: {
                email,
                password: "oauth",
                role: "customer",
                luckyPoints: 0,
                emailVerified: true
              }
            })

            logger.info("New user created via Google OAuth", { email })

          }

          return done(null, user)

        } catch (err) {

          logger.error("GOOGLE OAUTH ERROR:", err)
          return done(err, null)

        }

      }
    )
  )

} else {

  logger.warn("Google OAuth disabled: missing credentials")

}


/* =============================
   FACEBOOK STRATEGY
============================= */

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ["id", "emails", "name"]
      },

      async (accessToken, refreshToken, profile, done) => {

        try {

          const email = profile.emails?.[0]?.value

          if (!email) {
            return done(new Error("Facebook account has no email"), null)
          }

          let user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {

            user = await prisma.user.create({
              data: {
                email,
                password: "oauth",
                role: "customer",
                luckyPoints: 0,
                emailVerified: true
              }
            })

            logger.info("New user created via Facebook OAuth", { email })

          }

          return done(null, user)

        } catch (err) {

          logger.error("FACEBOOK OAUTH ERROR:", err)
          return done(err, null)

        }

      }
    )
  )

} else {

  logger.warn("Facebook OAuth disabled: missing credentials")

}


/* =============================
   SESSION HANDLING
============================= */

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {

  try {

    const user = await prisma.user.findUnique({
      where: { id }
    })

    done(null, user)

  } catch (err) {

    done(err, null)

  }

})

export default passport