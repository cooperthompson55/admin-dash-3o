"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ChevronUp, ChevronDown, Phone, Mail, MapPin, Clock, Save } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { RelativeTime } from "@/components/relative-time"
import React from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

// Define types based on the provided schema
type Address = {
  city: string
  street: string
  street2?: string
  zipCode: string
  province: string
}

type Service = {
  name: string
  count: number
  price: number
  total: number
}

type Booking = {
  id: string
  created_at: string
  property_size: string
  services: string | Service[] // Can be JSON string or array
  total_amount: number
  address: string | Address // Can be JSON string or object
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

type SortField = "preferred_date" | "created_at"
type SortDirection = "asc" | "desc"

interface BookingsTableProps {
  bookings: Booking[]
  onRefresh: () => void
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", hoverColor: "hover:bg-yellow-200" },
  { value: "editing", label: "Editing", color: "bg-purple-100 text-purple-800", hoverColor: "hover:bg-purple-200" },
  { value: "delivered", label: "Delivered", color: "bg-blue-100 text-blue-800", hoverColor: "hover:bg-blue-200" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800", hoverColor: "hover:bg-green-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", hoverColor: "hover:bg-red-200" },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: "not_paid", label: "Not Paid", color: "bg-red-100 text-red-800", hoverColor: "hover:bg-red-200" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800", hoverColor: "hover:bg-green-200" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800", hoverColor: "hover:bg-gray-200" },
]

const EDITING_STATUS_OPTIONS = [
  { value: "unassigned", label: "Unassigned", color: "bg-gray-100 text-gray-800", hoverColor: "hover:bg-gray-200" },
  { value: "in_editing", label: "In Editing", color: "bg-blue-100 text-blue-800", hoverColor: "hover:bg-blue-200" },
  { value: "with_editor", label: "With Editor", color: "bg-purple-100 text-purple-800", hoverColor: "hover:bg-purple-200" },
  { value: "done_editing", label: "Done Editing", color: "bg-green-100 text-green-800", hoverColor: "hover:bg-green-200" },
]

// Create Supabase client with explicit configuration
const supabaseUrl = "https://jshnsfvvsmjlxlbdpehf.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

export function BookingsTable({ bookings, onRefresh }: BookingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [modifiedBookings, setModifiedBookings] = useState<Record<string, { 
    status: string; 
    payment_status: string;
    editing_status: string;
  }>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [editingStatusFilter, setEditingStatusFilter] = useState<string>("all")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "created_at" ? "desc" : "asc")
    }
  }

  const toggleRowExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id)
  }

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setModifiedBookings(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        status: newStatus
      }
    }))
  }

  const handlePaymentStatusChange = (bookingId: string, newStatus: string) => {
    setModifiedBookings(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        payment_status: newStatus
      }
    }))
  }

  const handleEditingStatusChange = (bookingId: string, newStatus: string) => {
    setModifiedBookings(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        editing_status: newStatus
      }
    }))
  }

  const hasChanges = Object.keys(modifiedBookings).length > 0

  const handleSave = async () => {
    if (!hasChanges) return

    setIsSaving(true)
    setSaveError(null)
    try {
      const updates = Object.entries(modifiedBookings).map(([id, changes]) => {
        const original = bookings.find(b => b.id === id)
        return {
          ...original, // all original fields
          ...changes   // overwrite with any changes
        }
      })

      console.log('Saving updates:', updates) // Debug log

      const response = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save changes')
      }

      const { data } = await response.json()
      console.log('Save successful:', data) // Debug log
      setModifiedBookings({})
      onRefresh()
    } catch (error) {
      console.error('Error saving changes:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a[sortField]).getTime()
    const dateB = new Date(b[sortField]).getTime()
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA
  })

  // Filtering logic
  const filteredBookings = bookings.filter((booking) => {
    return (
      (statusFilter === "all" || booking.status === statusFilter) &&
      (paymentStatusFilter === "all" || booking.payment_status === paymentStatusFilter) &&
      (editingStatusFilter === "all" || booking.editing_status === editingStatusFilter)
    )
  })

  // Parse address - handles both string and object
  const parseAddress = (addressData: string | Address | null | undefined): Address => {
    if (!addressData) {
      return { city: "", street: "", zipCode: "", province: "" }
    }

    if (typeof addressData === "object") {
      return addressData as Address
    }

    try {
      return JSON.parse(addressData as string)
    } catch (e) {
      return { city: "", street: "", zipCode: "", province: "" }
    }
  }

  // Parse services - handles both string and array
  const parseServices = (servicesData: string | Service[] | null | undefined): Service[] => {
    if (!servicesData) {
      return []
    }

    if (Array.isArray(servicesData)) {
      return servicesData
    }

    try {
      return JSON.parse(servicesData as string)
    } catch (e) {
      return []
    }
  }

  // Format address for display (now only main address and city)
  const formatAddress = (addressData: string | Address | null | undefined): string => {
    const address = parseAddress(addressData)
    // Only show street and city
    return `${address.street || ""}${address.city ? ", " + address.city : ""}`
  }

  // Add delete booking function
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      console.log('Attempting to delete booking:', bookingId)
      console.log('Using Supabase URL:', supabaseUrl)
      
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('Delete operation completed successfully')
      
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      })
      
      // Refresh the bookings list
      onRefresh()
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  // If not mounted yet, return a loading state
  if (!isMounted) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        Loading...
      </div>
    )
  }

  // Mobile card view for bookings
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={editingStatusFilter} onValueChange={setEditingStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Editing Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Editing</SelectItem>
              {EDITING_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isSaving}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={hasChanges ? "bg-green-500 text-white hover:bg-green-600" : ""}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        {saveError && (
          <div className="p-4 bg-red-50 text-red-600 text-sm mb-4">
            {saveError}
          </div>
        )}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">No bookings found</div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      <Link href={`/bookings/${booking.id}`} className="cursor-pointer">
                        {booking.agent_name}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500">{booking.agent_company}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              <div className="p-4 space-y-3 border-b border-gray-100">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">
                    <a
                      href={formatAddress(booking.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline cursor-pointer"
                      title="Open in Google Maps"
                    >
                      {formatAddress(booking.address)}
                    </a>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Date: </span>
                    <Link href={`/bookings/${booking.id}`} className="cursor-pointer">
                      {formatDate(booking.preferred_date)}
                    </Link>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(booking.total_amount)}</div>
                </div>
              </div>

              <div className="p-4 flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <RelativeTime date={booking.created_at} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => toggleRowExpand(booking.id)}
                >
                  {expandedRowId === booking.id ? "Hide Details" : "View Details"}
                  <span className="ml-1">
                    {expandedRowId === booking.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </Button>
              </div>

              {expandedRowId === booking.id && (
                <div className="border-t border-gray-100">
                  <ExpandedBookingDetails 
                    booking={booking}
                    onStatusChange={(status) => handleStatusChange(booking.id, status)}
                    onPaymentStatusChange={(status) => handlePaymentStatusChange(booking.id, status)}
                    onEditingStatusChange={(status) => handleEditingStatusChange(booking.id, status)}
                    modifiedStatus={modifiedBookings[booking.id]?.status}
                    modifiedPaymentStatus={modifiedBookings[booking.id]?.payment_status}
                    modifiedEditingStatus={modifiedBookings[booking.id]?.editing_status}
                    onDelete={handleDeleteBooking}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={editingStatusFilter} onValueChange={setEditingStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Editing Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Editing</SelectItem>
              {EDITING_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isSaving}
        >
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={hasChanges ? "bg-green-500 text-white hover:bg-green-600" : ""}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        </div>
      </div>
      {saveError && (
        <div className="p-4 bg-red-50 text-red-600 text-sm">
          {saveError}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Preferred Date</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSort("preferred_date")}
                  >
                    {sortField === "preferred_date" && sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleSort("created_at")}>
                    {sortField === "created_at" && sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking, index) => (
                <React.Fragment key={booking.id}>
                  <TableRow className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <TableCell className="font-medium">
                      <Link href={`/bookings/${booking.id}`} className="cursor-pointer">
                        <div>{booking.agent_name}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <a
                        href={formatAddress(booking.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline cursor-pointer"
                        title="Open in Google Maps"
                      >
                        {formatAddress(booking.address)}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Link href={`/bookings/${booking.id}`} className="cursor-pointer">
                        {formatDate(booking.preferred_date)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={modifiedBookings[booking.id]?.status || booking.status}
                        onValueChange={(value) => handleStatusChange(booking.id, value)}
                      >
                        <SelectTrigger className={`w-[130px] border-0 focus:ring-0 ${
                          STATUS_OPTIONS.find(opt => opt.value === (modifiedBookings[booking.id]?.status || booking.status))?.color
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              className={`${option.color} ${option.hoverColor} focus:bg-opacity-100 data-[highlighted]:bg-opacity-100`}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                    <TableCell>
                      <RelativeTime date={booking.created_at} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleRowExpand(booking.id)}
                      >
                        {expandedRowId === booking.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRowId === booking.id && (
                    <TableRow className="bg-gray-50" key={booking.id + "-expanded"}>
                      <TableCell colSpan={7} className="p-0">
                        <ExpandedBookingDetails 
                          booking={booking}
                          onStatusChange={(status) => handleStatusChange(booking.id, status)}
                          onPaymentStatusChange={(status) => handlePaymentStatusChange(booking.id, status)}
                          onEditingStatusChange={(status) => handleEditingStatusChange(booking.id, status)}
                          modifiedStatus={modifiedBookings[booking.id]?.status}
                          modifiedPaymentStatus={modifiedBookings[booking.id]?.payment_status}
                          modifiedEditingStatus={modifiedBookings[booking.id]?.editing_status}
                          onDelete={handleDeleteBooking}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value.toLowerCase() === status.toLowerCase())
    return option ? option.color : "bg-gray-100 text-gray-800"
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {status}
    </span>
  )
}

function ExpandedBookingDetails({ 
  booking, 
  onStatusChange, 
  onPaymentStatusChange,
  onEditingStatusChange,
  modifiedStatus, 
  modifiedPaymentStatus,
  modifiedEditingStatus,
  onDelete
}: {
  booking: Booking;
  onStatusChange: (status: string) => void;
  onPaymentStatusChange: (status: string) => void;
  onEditingStatusChange: (status: string) => void;
  modifiedStatus?: string;
  modifiedPaymentStatus?: string;
  modifiedEditingStatus?: string;
  onDelete: (id: string) => Promise<void>;
}): React.ReactElement {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Parse address - handles both string and object
  const parseAddress = (addressData: string | Address | null | undefined): Address => {
    if (!addressData) {
      return { city: "", street: "", zipCode: "", province: "" }
    }

    if (typeof addressData === "object") {
      return addressData as Address
    }

    try {
      return JSON.parse(addressData as string)
    } catch (e) {
      return { city: "", street: "", zipCode: "", province: "" }
    }
  }

  // Parse services - handles both string and array
  const parseServices = (servicesData: string | Service[] | null | undefined): Service[] => {
    if (!servicesData) {
      return []
    }

    if (Array.isArray(servicesData)) {
      return servicesData
    }

    try {
      return JSON.parse(servicesData as string)
    } catch (e) {
      return []
    }
  }

  const address = parseAddress(booking.address)
  const services = parseServices(booking.services)

  // Helper to create a Google Maps directions link from the address
  const getGoogleMapsLink = (address: Address) => {
    const addr = `${address.street || ''}${address.street2 ? ', ' + address.street2 : ''}, ${address.city || ''}, ${address.province || ''} ${address.zipCode || ''}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  };

  return (
    <div className={`p-4 ${isMobile ? "p-3" : "p-6"} bg-gray-50 border-t border-gray-200`}>
      <div className={`grid grid-cols-1 ${isMobile ? "gap-4" : "md:grid-cols-2 gap-8"}`}>
        {/* Left Column: Client & Services Info */}
        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Client Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Full Name</span>
                <p className="text-sm font-medium">{booking.agent_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Email</span>
                <a
                  href={`mailto:${booking.agent_email}`}
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {booking.agent_email || "N/A"}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Phone</span>
                <a href={`tel:${booking.agent_phone}`} className="text-sm flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {booking.agent_phone || "N/A"}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Company</span>
                <p className="text-sm">{booking.agent_company || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Services Booked */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Services Booked</h3>
            {services && services.length > 0 ? (
              <ul className="space-y-2">
                {services.map((service, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm">
                      {service.name} {service.count > 1 ? `(x${service.count})` : ""}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(service.price)}</span>
                  </li>
                ))}
                <li className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm font-bold">{formatCurrency(booking.total_amount)}</span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No services listed</p>
            )}
          </div>
        </div>

        {/* Right Column: Property & Booking Info */}
        <div className="space-y-4">
          {/* Property Info */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Property Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Full Address</span>
                <p className="text-sm">
                  {address.street ? (
                    <a href={getGoogleMapsLink(address)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {address.street}
                      {address.street2 ? `, ${address.street2}` : ""}
                      <br />
                      {address.city}, {address.province} {address.zipCode}
                    </a>
                  ) : (
                    "Address not available"
                  )}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Property Size</span>
                <p className="text-sm">{booking.property_size || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Occupancy Status</span>
                <p className="text-sm">{booking.property_status || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Notes</span>
                <p className="text-sm bg-gray-50 p-2 rounded">{booking.notes || "No notes available"}</p>
              </div>
            </div>
          </div>

          {/* Booking Metadata */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Booking Metadata</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Preferred Date</span>
                <p className="text-sm">{formatDate(booking.preferred_date) || "Not specified"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Created</span>
                <p className="text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <RelativeTime date={booking.created_at} />
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Payment Status</span>
                <Select
                  value={modifiedPaymentStatus || booking.payment_status}
                  onValueChange={onPaymentStatusChange}
                >
                  <SelectTrigger className={`w-[130px] border-0 focus:ring-0 ${
                    PAYMENT_STATUS_OPTIONS.find(opt => opt.value === (modifiedPaymentStatus || booking.payment_status))?.color
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className={`${option.color} ${option.hoverColor} focus:bg-opacity-100 data-[highlighted]:bg-opacity-100`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Job Status</span>
                <Select
                  value={modifiedStatus || booking.status}
                  onValueChange={onStatusChange}
                >
                  <SelectTrigger className={`w-[130px] border-0 focus:ring-0 ${
                    STATUS_OPTIONS.find(opt => opt.value === (modifiedStatus || booking.status))?.color
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className={`${option.color} ${option.hoverColor} focus:bg-opacity-100 data-[highlighted]:bg-opacity-100`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Editing Status</span>
                <Select
                  value={modifiedEditingStatus || booking.editing_status}
                  onValueChange={onEditingStatusChange}
                >
                  <SelectTrigger className={`w-[130px] border-0 focus:ring-0 ${
                    EDITING_STATUS_OPTIONS.find(opt => opt.value === (modifiedEditingStatus || booking.editing_status))?.color
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITING_STATUS_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className={`${option.color} ${option.hoverColor} focus:bg-opacity-100 data-[highlighted]:bg-opacity-100`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          asChild
        >
          <Link href={`/bookings/${booking.id}`}>View Details</Link>
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
              onDelete(booking.id)
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
