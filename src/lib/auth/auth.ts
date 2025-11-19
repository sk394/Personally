import { sendEmail } from './send-email';
import { createDefaultProjectsForUser } from './user-project-setup';
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { mcp } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";
import { passkey } from "better-auth/plugins/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { reactStartCookies } from "better-auth/react-start";
import ResetPasswordEmail from "@/components/auth/reset-password-email";
import SendVerificationOTP from "@/components/auth/send-verification-otp";
import WelcomeEmail from "@/components/auth/welcome-email";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema/auth";
import { env } from "../env.server";
// import { ac, admin as adminRole, superadmin as superAdminRole, user as userRole } from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  baseURL: env.SERVER_URL,
  trustedOrigins: [env.SERVER_URL],
  onAPIError: {
    throw: true,
    onError: (error) => {
      console.error("auth onAPIError", error);
    },
    errorURL: "/login",
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
    }
  },
  logger: {
    enabled: true,
    level: "info",
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Send welcome email
          await sendEmail({
            subject: "Welcome to Personally!",
            template: WelcomeEmail({
              username: user.name || user.email,
            }),
            to: user.email,
          });

          // Create default projects for the user
          try {
            await createDefaultProjectsForUser(user.id);
            console.log(`Default projects created for user: ${user.email}`);
          } catch (error) {
            console.error(`Failed to create default projects for user ${user.email}:`, error);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable this since we're using OTP
    async sendResetPassword({ url, user }) {
      await sendEmail({
        subject: "Reset your password",
        template: ResetPasswordEmail({
          resetLink: url,
          username: user.email,
        }),
        to: user.email,
      });
    },
  },

  plugins: [
    twoFactor(),
    passkey(),
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
      loginPage: "/login",
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendEmail({
          subject: "Verify your email",
          template: SendVerificationOTP({
            username: email,
            otp,
          }),
          to: email,
        });
      },
    }),
    reactStartCookies(), // make sure this is the last plugin in the array
  ],
});
