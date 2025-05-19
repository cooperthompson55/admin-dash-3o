"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import { createClient } from "@supabase/supabase-js"
import { BookingsTable } from "@/components/bookings-table"
import { TopNavigation } from "@/components/top-navigation"
import { Loader2, RefreshCw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { DaySchedule } from "@/components/day-schedule"

// Define the Booking type
type Booking = {
  id: string
  created_at: string
  property_size: string
  services: any
  total_amount: number
  address: any
  notes: string
  preferred_date: string
  property_status: string
  status: string
  payment_status: string
  editing_status: string
  user_id: string | null
  agent_name: string
  agent_email: string
  agent_phone: number
  agent_company: string
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Polling interval in milliseconds (30 seconds for more frequent checks)
const POLLING_INTERVAL = 30 * 1000

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newBookingsCount, setNewBookingsCount] = useState(0)
  const previousBookingCount = useRef(0)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Function to fetch all bookings
  const fetchBookings = useCallback(
    async (isManualRefresh = false, silent = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true)
        } else if (!lastUpdated && !silent) {
          setLoading(true)
        }

        if (!silent) setError(null)

        console.log("Fetching bookings...", new Date().toISOString())

        const { data, error: supabaseError } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false }) // Order by newest first

        if (supabaseError) {
          console.error("Error fetching bookings:", supabaseError)
          if (!silent) setError("Failed to load bookings. Please try again.")
          return
        }

        // Check if we have new bookings
        if (previousBookingCount.current > 0 && data && data.length > previousBookingCount.current) {
          const newCount = data.length - previousBookingCount.current
          setNewBookingsCount(newCount)

          // Show notification
          toast({
            title: `${newCount} New Booking${newCount > 1 ? "s" : ""}`,
            description: "New bookings have been received",
            variant: "default",
          })

          console.log(`${newCount} new bookings detected!`)
        }

        // Update the previous count
        previousBookingCount.current = data ? data.length : 0

        if (!silent) {
          setBookings(data || [])
          setLastUpdated(new Date())
        }

        return data
      } catch (err) {
        console.error("Error fetching bookings:", err)
        if (!silent) setError("An unexpected error occurred. Please try again.")
      } finally {
        if (!silent) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [lastUpdated, toast],
  )

  // Function to schedule the next poll
  const schedulePoll = useCallback(() => {
    // Clear any existing timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
    }

    // Schedule the next poll
    pollTimeoutRef.current = setTimeout(async () => {
      console.log("Polling for new bookings...", new Date().toISOString())
      const newData = await fetchBookings(false, true)

      if (newData && (!bookings.length || JSON.stringify(newData) !== JSON.stringify(bookings))) {
        console.log("New data detected, updating UI")
        setBookings(newData)
        setLastUpdated(new Date())
      } else {
        console.log("No changes detected")
      }

      // Schedule the next poll
      schedulePoll()
    }, POLLING_INTERVAL)
  }, [bookings, fetchBookings])

  // Initial data fetch and set up polling
  useEffect(() => {
    // Fetch data immediately on page load
    fetchBookings()

    // Set up visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab is now visible, fetching fresh data")
        fetchBookings()
      }
    }

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Start polling
    schedulePoll()

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [fetchBookings, schedulePoll])

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchBookings(true)
    setNewBookingsCount(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop, overlay for mobile/narrow desktop */}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-white text-gray-900 flex-col py-8 px-4 min-h-screen shadow-lg border-r border-gray-200 rounded-r-3xl z-20 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <img src="/rephotos-logo.png" alt="RePhotos Logo" className="h-20 w-auto mb-2" />
        </div>
        <nav className="flex flex-col gap-2">
          <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Dashboard</div>
          <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Calendar</div>
          <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Bookings</div>
          <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Clients</div>
          <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Reports</div>
          <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Settings</div>
        </nav>
      </aside>
      {/* Overlay sidebar for mobile and narrow desktop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white text-gray-900 flex flex-col py-8 px-4 shadow-lg border-r border-gray-200 rounded-r-3xl z-50 animate-slide-in">
            <div className="flex flex-col items-center mb-8">
              <img src="/rephotos-logo.png" alt="RePhotos Logo" className="h-20 w-auto mb-2" />
            </div>
            <nav className="flex flex-col gap-2">
              <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Dashboard</div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Calendar</div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Bookings</div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Clients</div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Reports</div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition">Settings</div>
            </nav>
          </aside>
        </div>
      )}
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <TopNavigation onBurgerClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 w-full px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-start w-full h-full">
            <div className="w-full lg:w-[340px] lg:min-w-[300px] lg:max-w-[380px] lg:mr-4 mb-4 lg:mb-0">
              <DaySchedule bookings={bookings} />
            </div>
            <div className="flex-1 w-full">
              <h2 className="text-2xl font-semibold mb-4">All Bookings</h2>
              <BookingsTable bookings={bookings} onRefresh={handleManualRefresh} />
            </div>
          </div>
        </main>
        {/* Debug info - remove in production */}
        <div className="mt-8 text-xs text-gray-400 border-t pt-4">
          <p>Polling interval: {POLLING_INTERVAL / 1000} seconds</p>
        </div>
      </div>
    </div>
  )
}
