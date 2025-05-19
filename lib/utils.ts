import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "N/A"

  try {
    const date = typeof dateInput === "string" 
      ? new Date(dateInput + (dateInput.includes('T') ? '' : 'T12:00:00'))
      : dateInput
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  } catch (e) {
    return String(dateInput)
  }
}

export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return "N/A"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatRelativeTime(dateInput: string | Date): string {
  if (!dateInput) return "N/A"

  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Less than a minute
    if (diffInSeconds < 60) {
      return diffInSeconds <= 5 ? "just now" : `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`
    }

    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`
    }

    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`
    }

    // Less than a week
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`
    }

    // Less than a month
    if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7)
      return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""} ago`
    }

    // Less than a year
    if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30)
      return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`
    }

    // More than a year
    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`
  } catch (e) {
    return String(dateInput)
  }
}
