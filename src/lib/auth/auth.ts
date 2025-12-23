import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { mcp } from 'better-auth/plugins'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from '../env.server'
import { sendEmail } from './send-email'
import ResetPasswordEmail from '@/components/auth/reset-password-email'
import SendVerificationOTP from '@/components/auth/send-verification-otp'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema/auth'
// import { ac, admin as adminRole, superadmin as superAdminRole, user as userRole } from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  basePath: '/api/auth',
  baseURL: env.SERVER_URL,
  trustedOrigins: [env.SERVER_URL],
  onAPIError: {
    throw: true,
    onError: (error) => {
      console.error('auth onAPIError', error)
    },
    errorURL: '/signin',
  },
  rateLimit: {
    enabled: true,
    max: 100,
    window: 10,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 1000 * 60 * 5, // 5 minutes
    },
  },
  logger: {
    enabled: true,
    level: 'info',
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log('New user created:', user.id, user.email)
          // Send welcome email
          // await sendEmail({
          //   subject: 'Welcome to Personally!',
          //   template: WelcomeEmail({
          //     username: user.name || user.email,
          //   }),
          //   to: user.email,
          // })

          // Default project creation removed to provide empty dashboard state
          // Users will create projects as needed from the dashboard
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable this since we're using OTP
    async sendResetPassword({ url, user }) {
      await sendEmail({
        subject: 'Reset your password',
        template: ResetPasswordEmail({
          resetLink: url,
          username: user.email,
        }),
        to: user.email,
      })
    },
  },

  plugins: [
    twoFactor(),
    // admin({
    //   defaultRole: "user",
    //   adminRoles: ["admin", "superadmin"],
    //   ac,
    //   roles: {
    //     user: userRole,
    //     admin: adminRole,
    //     superadmin: superAdminRole,
    //   },
    // }),
    mcp({
      loginPage: '/signin',
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendEmail({
          subject: 'Verify your email',
          template: SendVerificationOTP({
            username: email,
            otp,
          }),
          to: email,
        })
      },
    }),
    tanstackStartCookies(), // make sure this is the last plugin in the array
  ],
})
