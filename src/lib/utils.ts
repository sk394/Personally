import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v7 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uuid = () => v7();

export function getSessionUser(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies["better-auth.session_data"]; // cookie name
  if (!sessionCookie) return null;

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf8"));
    return decoded?.session?.user ?? null;
  } catch (err) {
    console.error("Invalid session cookie:", err);
    return null;
  }
}

// cookie parser
function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((v) => v.trim().split("="))
      .map(([key, ...rest]) => [key, rest.join("=")])
  );
}

export function formatCurrency(amountInCents: number, currency: string = 'USD') {
  const amount = amountInCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}