import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import config from "./index.js";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        googleId: users.googleId,
      })
      .from(users)
      .where(eq(users.id, id));
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId!,
      clientSecret: config.googleClientSecret!,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by Google ID
        let [user] = await db
          .select()
          .from(users)
          .where(eq(users.googleId, profile.id));

        if (user) {
          return done(null, user);
        }

        // Check if user exists by email
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        [user] = await db.select().from(users).where(eq(users.email, email));

        if (user) {
          // Link Google ID to existing account if not already linked
          if (!user.googleId) {
            [user] = await db
              .update(users)
              .set({ googleId: profile.id })
              .where(eq(users.id, user.id))
              .returning();
          }
          return done(null, user);
        }

        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            firstName: profile.name?.givenName || "Unknown",
            lastName: profile.name?.familyName || "Unknown",
            email: email,
            googleId: profile.id,
          })
          .returning();

        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

export default passport;
