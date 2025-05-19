import React, { useState, useEffect } from "react"
import { format, isToday, isYesterday, isTomorrow, startOfDay, endOfDay, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"

// Types should match your Booking type
interface Address {
  city: string
  street: string
  street2?: string
  zipCode: string
  province: string
}

interface Booking {
  id: string
  preferred_date: string // ISO string
  agent_name: string
  address: string | Address
  status: string
  property_size?: string
  time?: string // Optionally, if you have a time field
}

interface DayScheduleProps {
  bookings: Booking[]
}

function formatAddress(address: string | Address, propertySize?: string) {
  if (typeof address === "string") return address
  const { street, street2, city, province, zipCode } = address
  return `${street}${street2 ? `, ${street2}` : ""}, ${city}, ${province} ${zipCode}${propertySize ? ` (${propertySize})` : ""}`
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ bookings }) => {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    // Set initial date to start of current day
    const now = new Date()
    setSelectedDate(startOfDay(now))
  }, [])

  if (!selectedDate) {
    return <div className="bg-white rounded-lg p-6 shadow max-w-sm w-full">Loading...</div>
  }

  // Filter bookings for the selected day using start and end of day
  const filtered = bookings.filter(b => {
    // Parse the booking date and ensure it's treated as UTC
    const bookingDate = parseISO(b.preferred_date)
    const bookingDay = startOfDay(bookingDate)
    
    // Compare with the selected day
    const selectedDay = startOfDay(selectedDate)
    
    return bookingDay.getTime() === selectedDay.getTime()
  })

  // Sort by time if available
  const sorted = filtered.sort((a, b) => {
    // If both bookings have times, compare them
    if (a.time && b.time) {
      return a.time.localeCompare(b.time)
    }
    // If only one booking has a time, prioritize the one with time
    if (a.time) return -1
    if (b.time) return 1
    // If neither has a time, keep original order
    return 0
  })

  function goToPrevDay() {
    setSelectedDate(d => d ? startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)) : startOfDay(new Date()))
  }
  
  function goToNextDay() {
    setSelectedDate(d => d ? startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) : startOfDay(new Date()))
  }
  
  function goToToday() {
    setSelectedDate(startOfDay(new Date()))
  }

  // Helper to get dynamic label
  function getDayLabel(date: Date) {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "MMM d")
  }

  const handleBookingClick = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow max-w-sm w-full mt-6 pt-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">Day Schedule</h2>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="icon" onClick={goToPrevDay}>&lt;</Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={isToday(selectedDate) ? "default" : "outline"}
                onClick={() => setCalendarOpen(true)}
                aria-label="Pick a date"
              >
                {getDayLabel(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0 overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => {
                  if (date) setSelectedDate(startOfDay(date))
                  setCalendarOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={goToNextDay}>&gt;</Button>
        </div>
      </div>
      <div className="text-gray-500 mb-4">{format(selectedDate, "MMMM d, yyyy")}</div>
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <div className="text-gray-400 text-center">No shoots for this day</div>
        ) : (
          sorted.map(b => (
            <div 
              key={b.id} 
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-4 border cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleBookingClick(b.id)}
            >
              <div>
                <div className="font-semibold text-lg">
                  {b.time ? format(new Date(`2000-01-01T${b.time}`), "h:mm a") : "Time TBD"}
                </div>
                <div className="font-medium">{b.agent_name}</div>
                <div className="text-xs text-gray-500">{formatAddress(b.address, b.property_size)}</div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  b.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  b.status === "editing" ? "bg-purple-100 text-purple-800" :
                  b.status === "delivered" ? "bg-blue-100 text-blue-800" :
                  b.status === "completed" ? "bg-green-100 text-green-800" :
                  b.status === "cancelled" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 