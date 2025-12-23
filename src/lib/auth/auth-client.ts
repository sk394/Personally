import {
  emailOTPClient,
  multiSessionClient,
  twoFactorClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { env } from '@/lib/env.client'

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [
    twoFactorClient(),
    emailOTPClient(),
    multiSessionClient(),
  ],
})

export type AuthClient = ReturnType<typeof createAuthClient>
