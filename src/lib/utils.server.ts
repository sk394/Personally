export function getSessionUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? ''
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  const sessionCookie = cookies['better-auth.session_data'] // cookie name
  if (!sessionCookie) return null

  try {
    const decoded = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString('utf8'),
    )
    return decoded?.session?.user ?? null
  } catch (err) {
    console.error('Invalid session cookie:', err)
    return null
  }
}

// cookie parser
function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((v) => v.trim().split('='))
      .map(([key, ...rest]) => [key, rest.join('=')]),
  )
}
