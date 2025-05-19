"use client"

import { useEffect, useState } from "react"
import { formatRelativeTime } from "@/lib/utils"

interface RelativeTimeProps {
  date: string | Date
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const dateString = date instanceof Date ? date.toISOString() : date
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(dateString))

  useEffect(() => {
    // Update immediately
    setRelativeTime(formatRelativeTime(dateString))

    // Set up interval to update the relative time
    const intervalId = setInterval(() => {
      setRelativeTime(formatRelativeTime(dateString))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(intervalId)
  }, [dateString])

  return <span className={className}>{relativeTime}</span>
}
