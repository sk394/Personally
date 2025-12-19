import { createMiddleware } from '@tanstack/react-start'
import { getRequest, setResponseStatus } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth/auth'
import { redirect } from '@tanstack/react-router'

export const authMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
    query: {
      // ensure session is fresh
      // https://www.better-auth.com/docs/concepts/session-management#session-caching
      disableCookieCache: true,
    },
  })

  if (!session) {
    setResponseStatus(401)
    return redirect({
      to: '/signin',
    })
  }
  return await next({
    context: {
      user: session.user,
    },
  })
})
