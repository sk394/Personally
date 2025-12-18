import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v7 } from 'uuid'
import type { ClassValue } from 'clsx';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export const uuid = () => v7()

export function formatCurrency(
  amountInCents: number,
  currency: string = 'USD',
) {
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

export function formatProperName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\p{L}/gu, char => char.toUpperCase())
}