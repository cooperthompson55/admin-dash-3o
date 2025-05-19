"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, ArrowUp, ArrowDown, X, Check, FolderPlus, Mail } from "lucide-react"
import { format, parse } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CreateMediaDeliveryEmailModal } from '../../components/modals/create-media-delivery-email-modal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Service = { name: string; price: number };

const SERVICE_CATALOG: Record<string, Service[]> = {
  '< 1000 sq ft': [
    { name: 'HDR Photography', price: 149.99 },
    { name: '360° Virtual Tour', price: 159.99 },
    { name: 'Social Media Reel', price: 179.99 },
    { name: 'Drone Aerial Photos', price: 124.99 },
    { name: 'Drone Aerial Video', price: 124.99 },
    { name: '2D Floor Plan', price: 89.99 },
    { name: '3D House Model', price: 149.99 },
    { name: 'Property Website', price: 99.99 },
    { name: 'Custom Domain Name', price: 24.99 },
    { name: 'Virtual Staging', price: 39.99 },
  ],
  '1000-2000 sq ft': [
    { name: 'HDR Photography', price: 199.99 },
    { name: '360° Virtual Tour', price: 189.99 },
    { name: 'Social Media Reel', price: 199.99 },
    { name: 'Drone Aerial Photos', price: 124.99 },
    { name: 'Drone Aerial Video', price: 124.99 },
    { name: '2D Floor Plan', price: 119.99 },
    { name: '3D House Model', price: 179.99 },
    { name: 'Property Website', price: 99.99 },
    { name: 'Custom Domain Name', price: 24.99 },
    { name: 'Virtual Staging', price: 39.99 },
  ],
  '2000-3000 sq ft': [
    { name: 'HDR Photography', price: 249.99 },
    { name: '360° Virtual Tour', price: 219.99 },
    { name: 'Social Media Reel', price: 219.99 },
    { name: 'Drone Aerial Photos', price: 124.99 },
    { name: 'Drone Aerial Video', price: 124.99 },
    { name: '2D Floor Plan', price: 149.99 },
    { name: '3D House Model', price: 209.99 },
    { name: 'Property Website', price: 99.99 },
    { name: 'Custom Domain Name', price: 24.99 },
    { name: 'Virtual Staging', price: 39.99 },
  ],
  '3000-4000 sq ft': [
    { name: 'HDR Photography', price: 299.99 },
    { name: '360° Virtual Tour', price: 249.99 },
    { name: 'Social Media Reel', price: 239.99 },
    { name: 'Drone Aerial Photos', price: 124.99 },
    { name: 'Drone Aerial Video', price: 124.99 },
    { name: '2D Floor Plan', price: 179.99 },
    { name: '3D House Model', price: 239.99 },
    { name: 'Property Website', price: 99.99 },
    { name: 'Custom Domain Name', price: 24.99 },
    { name: 'Virtual Staging', price: 39.99 },
  ],
  '4000-5000 sq ft': [
    { name: 'HDR Photography', price: 349.99 },
    { name: '360° Virtual Tour', price: 279.99 },
    { name: 'Social Media Reel', price: 259.99 },
    { name: 'Drone Aerial Photos', price: 124.99 },
    { name: 'Drone Aerial Video', price: 124.99 },
    { name: '2D Floor Plan', price: 209.99 },
    { name: '3D House Model', price: 269.99 },
    { name: 'Property Website', price: 99.99 },
    { name: 'Custom Domain Name', price: 24.99 },
    { name: 'Virtual Staging', price: 39.99 },
  ],
};

// Property size and occupancy status options
const PROPERTY_SIZE_OPTIONS = [
  '< 1000 sq ft',
  '1000-2000 sq ft',
  '2000-3000 sq ft',
  '3000-4000 sq ft',
  '4000-5000 sq ft',
];
const OCCUPANCY_STATUS_OPTIONS = ['Vacant', 'Occupied', 'Tenanted', 'Other'];

// Add this helper function near the top of the file
const TruncatedLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="truncate text-blue-600 hover:underline max-w-[300px] block"
        >
          {children}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-[400px] break-all">{href}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

// Add this helper function near the top of the file, after SERVICE_CATALOG
const getDiscountInfo = (total: number) => {
  if (total >= 1100) return { percent: 17, min: 1100, max: Infinity };
  if (total >= 900) return { percent: 15, min: 900, max: 1099.99 };
  if (total >= 700) return { percent: 12, min: 700, max: 899.99 };
  if (total >= 500) return { percent: 10, min: 500, max: 699.99 };
  if (total >= 350) return { percent: 5, min: 350, max: 499.99 };
  if (total >= 199.99) return { percent: 3, min: 199.99, max: 349.99 };
  return { percent: 0, min: 0, max: 199.98 };
};

const applyDiscount = (total: number) => {
  const { percent } = getDiscountInfo(total);
  return total * (1 - percent / 100);
};

// Add this helper near the top, after other helpers
const getGoogleMapsLink = (addressObj: any) => {
  if (!addressObj) return '#';
  const { street, street2, city, province, zipCode } = typeof addressObj === 'object' ? addressObj : {};
  const address = `${street || ''}${street2 ? ', ' + street2 : ''}, ${city || ''}, ${province || ''} ${zipCode || ''}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
};

// Add this function before the BookingDetailsPage component
function composeMediaReadyEmail(booking: any) {
  const clientFirstName = booking.agent_name.split(' ')[0]
  const address = typeof booking.address === 'string' ? booking.address : JSON.stringify(booking.address)
  const services = typeof booking.services === 'string' ? JSON.parse(booking.services) : booking.services
  const servicesList = services.map((service: any) => `${service.name} (${service.count})`).join(', ')
  
  const emailBody = `Hi ${clientFirstName},

Thanks again for choosing RePhotos! Your final media for the listing at ${address} is now ready.

📍 Property: ${address}
📅 Shoot Date: ${booking.preferred_date} ${booking.time || ''}
📦 Services Completed: ${servicesList}

🔗 Final Media Download: ${booking.final_edits_link || 'Link not available'}
💸 Invoice: ${booking.invoice_link || 'Link not available'}

If you have any questions or need revisions, just let us know. We look forward to working with you again soon!

Best,
Cooper
Rephotos.ca`

  const subject = `Your Final Photos for ${address} Are Ready!`
  const mailtoLink = `mailto:${booking.agent_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
  
  return mailtoLink
}

export default function BookingDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState("");
  const [showCustomService, setShowCustomService] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast()
  const [creatingFolders, setCreatingFolders] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const fetchBooking = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single()
    if (error) setError("Failed to load booking.")
    setBooking(data)
    setForm(data)
    setLoading(false)
  }

  useEffect(() => {
    if (bookingId) fetchBooking()
  }, [bookingId])

  useEffect(() => {
    if (!editing) return;
    const size = form.property_size;
    if (!size) return;
    const catalog = getAvailableServices();
    const current = getServicesArray(form.services);
    let updated = false;
    const newServices = current.map((s: Service & { count?: number }) => {
      const match = catalog.find((cat: Service) => cat.name === s.name);
      if (match && s.price !== match.price) {
        updated = true;
        return { ...s, price: match.price };
      }
      return s;
    });
    if (updated) {
      handleChange("services", newServices);
      handleChange("total_amount", recalcTotal(newServices));
    }
    // eslint-disable-next-line
  }, [form.property_size, editing]);

  const handleChange = (field: string, value: any) => {
    console.log(`Changing ${field} to:`, value)
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    let updatedForm = { ...form }
    
    // Format time properly for Supabase time column
    if (updatedForm.time) {
      console.log('Original time value:', updatedForm.time)
      
      // If time is in HH:mm format, append :00
      if (updatedForm.time.length === 5) {
        updatedForm.time = updatedForm.time + ':00'
      }
      // If time is in HH:mm:ss format, ensure it's valid
      else if (updatedForm.time.length === 8) {
        // Validate the time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
        if (!timeRegex.test(updatedForm.time)) {
          setError("Invalid time format. Please use HH:mm:ss format.")
          setSaving(false)
          return
        }
      }
      
      console.log('Formatted time for Supabase:', updatedForm.time)
    }

    // Format preferred_date properly for Supabase date column
    if (updatedForm.preferred_date) {
      console.log('Original date value:', updatedForm.preferred_date)
      
      // Ensure the date is in ISO format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(updatedForm.preferred_date)) {
        setError("Invalid date format. Please use YYYY-MM-DD format.")
        setSaving(false)
        return
      }
      
      // Add time component to make it a full ISO datetime
      updatedForm.preferred_date = `${updatedForm.preferred_date}T00:00:00`
      console.log('Formatted date for Supabase:', updatedForm.preferred_date)
    }

    try {
      // Use the same update endpoint as the main dashboard
      const response = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([updatedForm]), // Wrap in array as the endpoint expects an array
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save changes')
      }

      const { data } = await response.json()
      console.log('Save successful:', data)
      
      if (data && data[0]) {
        setBooking(data[0])
        setForm(data[0])
        setEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 1200)
      } else {
        throw new Error('No data returned after update')
      }
    } catch (err) {
      console.error('Error in save operation:', err)
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  // Helper to get services as array
  const getServicesArray = (services: any) => {
    if (!services) return [];
    if (Array.isArray(services)) return services;
    try {
      return JSON.parse(services);
    } catch {
      return [];
    }
  };

  // Helper to recalculate total
  const recalcTotal = (servicesArr: any[]) =>
    servicesArr.reduce((sum, s) => sum + (s.price * (s.count || 1)), 0);

  // Handler to add a service
  const handleAddService = (serviceName: string) => {
    const service = getAvailableServices().find((s: Service) => s.name === serviceName);
    if (!service) return;
    const current = getServicesArray(form.services);
    // If already exists, increment count
    const idx = current.findIndex((s: Service & { count?: number }) => s.name === serviceName);
    let updated;
    if (idx > -1) {
      updated = [...current];
      updated[idx] = { ...updated[idx], count: (updated[idx].count || 1) + 1 };
    } else {
      updated = [{ ...service, count: 1 }, ...current]; // Add new service at the top
    }
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
  };

  // Handler to remove a service
  const handleRemoveService = (serviceName: string) => {
    const current = getServicesArray(form.services);
    const idx = current.findIndex((s: Service & { count?: number }) => s.name === serviceName);
    if (idx === -1) return;
    let updated = [...current];
    if ((updated[idx].count || 1) > 1) {
      updated[idx] = { ...updated[idx], count: updated[idx].count - 1 };
    } else {
      updated.splice(idx, 1);
    }
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
  };

  // Add increment and decrement handlers
  const handleIncrementService = (serviceName: string) => {
    const current = getServicesArray(form.services);
    const idx = current.findIndex((s: Service & { count?: number }) => s.name === serviceName);
    if (idx === -1) return;
    const updated = [...current];
    updated[idx] = { ...updated[idx], count: (updated[idx].count || 1) + 1 };
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
  };

  const handleDecrementService = (serviceName: string) => {
    const current = getServicesArray(form.services);
    const idx = current.findIndex((s: Service & { count?: number }) => s.name === serviceName);
    if (idx === -1) return;
    let updated = [...current];
    if ((updated[idx].count || 1) > 1) {
      updated[idx] = { ...updated[idx], count: updated[idx].count - 1 };
    } else {
      updated.splice(idx, 1);
    }
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
  };

  // Helper to get available services based on property_size
  function getAvailableServices(): Service[] {
    // Try to match property_size exactly, fallback to first if not found
    const size = form.property_size || booking?.property_size || '';
    if (SERVICE_CATALOG[size]) return SERVICE_CATALOG[size];
    // Try to match by substring (in case of formatting differences)
    const found = Object.keys(SERVICE_CATALOG).find(key => size.includes(key.split(' ')[0]));
    if (found) return SERVICE_CATALOG[found];
    // Fallback to first
    return SERVICE_CATALOG[Object.keys(SERVICE_CATALOG)[0]];
  }

  const handleAddCustomService = () => {
    if (!customServiceName.trim() || isNaN(Number(customServicePrice))) return;
    const newService = {
      name: customServiceName.trim(),
      price: parseFloat(customServicePrice),
      count: 1,
    };
    const current = getServicesArray(form.services);
    const updated = [newService, ...current];
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
    setCustomServiceName("");
    setCustomServicePrice("");
    setShowCustomService(false);
  };

  // Add move up/down handlers
  const handleMoveServiceUp = (index: number) => {
    const current = getServicesArray(form.services);
    if (index <= 0) return;
    const updated = [...current];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
  };

  const handleMoveServiceDown = (index: number) => {
    const current = getServicesArray(form.services);
    if (index >= current.length - 1) return;
    const updated = [...current];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    handleChange("services", updated);
    handleChange("total_amount", recalcTotal(updated));
  };

  // Helper to get address object from form or booking
  function getAddressObj(addr: any) {
    if (!addr) return { street: '', street2: '', city: '', province: '', zipCode: '' };
    if (typeof addr === 'object') return { street: '', street2: '', city: '', province: '', zipCode: '', ...addr };
    try {
      return { street: '', street2: '', city: '', province: '', zipCode: '', ...JSON.parse(addr) };
    } catch {
      return { street: '', street2: '', city: '', province: '', zipCode: '' };
    }
  }

  const createProjectFolders = async () => {
    setCreatingFolders(true)
    try {
      // Step 1: Create Dropbox folders
      const response = await fetch('/api/dropbox/create-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          propertyAddress: form.address,
          agentName: form.agent_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project folders')
      }

      const { rawPhotosLink, finalEditsLink } = await response.json()
      
      // Step 2: Update the form with the new links
      const updatedForm = {
        ...form,
        raw_photos_link: rawPhotosLink,
        final_edits_link: finalEditsLink,
      }
      
      // Step 3: Save to Supabase
      const saveResponse = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([updatedForm]),
      })

      const responseData = await saveResponse.json()

      if (!saveResponse.ok) {
        console.error('Save response error:', responseData)
        throw new Error(responseData.error || 'Failed to save links to booking')
      }

      if (!responseData.data || !responseData.data[0]) {
        throw new Error('No data returned after update')
      }

      // Step 4: Update local state
      setForm(updatedForm)
      setBooking(responseData.data[0])

      toast({
        title: "Success",
        description: "Project folders created and links saved successfully",
      })
    } catch (error) {
      console.error('Error in createProjectFolders:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project folders or save links",
        variant: "destructive",
      })
    } finally {
      setCreatingFolders(false)
    }
  }

  const handleEmailSent = async () => {
    // Refresh booking data to update delivery_email_sent status
    await fetchBooking()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!booking) {
    return <div className="p-8 text-center text-gray-500">Booking not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Booking Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsEmailModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                New Email
              </Button>
              {editing ? (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  Edit Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {error && <div className="mb-4 text-red-600">{error}</div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Full Name</span>
              {editing ? (
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={form.agent_name || ''}
                  onChange={e => handleChange('agent_name', e.target.value)}
                />
              ) : (
                booking.agent_name
              )}
            </div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Email</span>
              {editing ? (
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  type="email"
                  value={form.agent_email || ''}
                  onChange={e => handleChange('agent_email', e.target.value)}
                />
              ) : (
                booking.agent_email
              )}
            </div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Phone</span>
              {editing ? (
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  type="tel"
                  value={form.agent_phone || ''}
                  onChange={e => handleChange('agent_phone', e.target.value)}
                />
              ) : (
                booking.agent_phone
              )}
            </div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Company</span>
              {editing ? (
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={form.agent_company || ''}
                  onChange={e => handleChange('agent_company', e.target.value)}
                />
              ) : (
                booking.agent_company || 'N/A'
              )}
            </div>
          </div>
          {/* Property Information */}
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-4">Property Information</h2>
            <div className="mb-2">
              <span className="text-xs text-gray-500 block">Full Address</span>
              {editing ? (
                (() => {
                  const address = getAddressObj(form.address);
                  return (
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Street Address"
                        value={address.street}
                        onChange={e => handleChange('address', { ...address, street: e.target.value })}
                      />
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Apt, Suite, etc. (optional)"
                        value={address.street2 || ''}
                        onChange={e => handleChange('address', { ...address, street2: e.target.value })}
                      />
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="City"
                        value={address.city}
                        onChange={e => handleChange('address', { ...address, city: e.target.value })}
                      />
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Province"
                        value={address.province}
                        onChange={e => handleChange('address', { ...address, province: e.target.value })}
                      />
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Zip/Postal Code"
                        value={address.zipCode}
                        onChange={e => handleChange('address', { ...address, zipCode: e.target.value })}
                      />
                    </div>
                  );
                })()
              ) : (
                typeof booking.address === "string"
                  ? <a href={getGoogleMapsLink(booking.address)} target="_blank" rel="noopener noreferrer">{booking.address}</a>
                  : <a href={getGoogleMapsLink(booking.address)} target="_blank" rel="noopener noreferrer">{`${booking.address.street}${booking.address.street2 ? ", " + booking.address.street2 : ""}, ${booking.address.city}, ${booking.address.province} ${booking.address.zipCode}`}</a>
              )}
            </div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Property Size</span>
              {editing ? (
                <select
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={form.property_size || ''}
                  onChange={e => handleChange('property_size', e.target.value)}
                >
                  <option value="" disabled>Select property size...</option>
                  {PROPERTY_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              ) : (
                booking.property_size
              )}
            </div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Occupancy Status</span>
              {editing ? (
                <select
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={form.property_status || ''}
                  onChange={e => handleChange('property_status', e.target.value)}
                >
                  <option value="" disabled>Select occupancy status...</option>
                  {OCCUPANCY_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                booking.property_status
              )}
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500 block">Notes</span>
              {editing ? (
                <textarea
                  className="border rounded px-2 py-1 text-sm w-full min-h-[60px]"
                  value={form.notes || ""}
                  onChange={e => handleChange("notes", e.target.value)}
                  placeholder="Enter notes..."
                />
              ) : (
                <span className="text-sm bg-gray-50 p-2 rounded block">{booking.notes || "No notes available"}</span>
              )}
            </div>
          </div>
          {/* Booking Metadata */}
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-4">Booking Metadata</h2>
            <div className="mb-2">
              <span className="text-xs text-gray-500 block">Preferred Date</span>
              {editing ? (
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={form.preferred_date ? form.preferred_date.split('T')[0] : ""}
                  onChange={e => {
                    console.log('Date input changed:', e.target.value)
                    handleChange("preferred_date", e.target.value)
                  }}
                />
              ) : (
                format(new Date(booking.preferred_date + 'T12:00:00'), "MMMM d, yyyy")
              )}
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500 block">Time</span>
              {editing ? (
                <input
                  type="time"
                  className="border rounded px-2 py-1 text-sm"
                  value={form.time ? form.time.substring(0, 5) : ""}
                  onChange={e => {
                    console.log('Time input changed:', e.target.value)
                    handleChange("time", e.target.value)
                  }}
                />
              ) : (
                booking.time
                  ? format(parse(booking.time, "HH:mm:ss", new Date()), "h:mm a")
                  : "N/A"
              )}
            </div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Created</span>{booking.created_at}</div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Payment Status</span>{booking.payment_status}</div>
            <div className="mb-2"><span className="text-xs text-gray-500 block">Job Status</span>{booking.status}</div>
          </div>
          {/* Services Booked */}
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold mb-4">Services Booked</h2>
            {editing ? (
              <>
                <ul className="space-y-2 mb-4">
                  {getServicesArray(form.services).length === 0 && (
                    <li className="text-sm text-gray-500">No services selected</li>
                  )}
                  {getServicesArray(form.services).map((s: Service & { count?: number }, i: number) => (
                    <li key={s.name} className="flex items-center justify-between">
                      <span>{s.name} {s.count && s.count > 1 ? `(x${s.count})` : ""} - ${s.price}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full border p-1 bg-white hover:bg-gray-100 shadow-sm"
                          onClick={() => handleMoveServiceUp(i)}
                          disabled={i === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full border p-1 bg-white hover:bg-gray-100 shadow-sm"
                          onClick={() => handleMoveServiceDown(i)}
                          disabled={i === getServicesArray(form.services).length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecrementService(s.name)}>-</Button>
                        <span className="px-2">{s.count || 1}</span>
                        <Button size="sm" variant="outline" onClick={() => handleIncrementService(s.name)}>+</Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full border p-1 bg-white text-red-600 hover:bg-red-50 shadow-sm"
                          onClick={() => handleRemoveService(s.name)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value === "__custom__") {
                        setShowCustomService(true);
                        e.target.value = "";
                      } else if (e.target.value) {
                        handleAddService(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Add service...</option>
                    {getAvailableServices().filter((s: Service) => !getServicesArray(form.services).some((cs: Service & { count?: number }) => cs.name === s.name)).map((s: Service) => (
                      <option key={s.name} value={s.name}>{s.name} - ${s.price}</option>
                    ))}
                    <option value="__custom__">Custom Service...</option>
                  </select>
                </div>
                {showCustomService && (
                  <div className="flex flex-col gap-2 mt-2">
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Service name"
                      value={customServiceName}
                      onChange={e => setCustomServiceName(e.target.value)}
                    />
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={customServicePrice}
                      onChange={e => setCustomServicePrice(e.target.value)}
                    />
                    <Button size="sm" onClick={handleAddCustomService} disabled={!customServiceName.trim() || isNaN(Number(customServicePrice))}>Add</Button>
                  </div>
                )}
                <div className="mt-4 font-bold">
                  Total before discount: ${form.total_amount?.toFixed(2) ?? "0.00"}
                </div>
                {(() => {
                  const discountInfo = getDiscountInfo(form.total_amount || 0);
                  if (discountInfo.percent > 0) {
                    const discounted = applyDiscount(form.total_amount || 0);
                    return (
                      <div className="mt-1 text-green-700 font-semibold">
                        Volume Discount: {discountInfo.percent}%<br />
                        Discounted Total: ${discounted.toFixed(2)}
                      </div>
                    );
                  } else {
                    return <div className="mt-1 text-gray-500">No volume discount applied</div>;
                  }
                })()}
              </>
            ) : (
              <>
                <div>{Array.isArray(booking.services) ? booking.services.map((s: Service & { count?: number }, i: number) => <div key={i}>{s.name}{s.count && s.count > 1 ? ` (x${s.count})` : ""} - ${s.price}</div>) : booking.services}</div>
                <div className="mt-4 font-bold">
                  Total before discount: ${booking.total_amount?.toFixed(2) ?? "0.00"}
                </div>
                {(() => {
                  const discountInfo = getDiscountInfo(booking.total_amount || 0);
                  if (discountInfo.percent > 0) {
                    const discounted = applyDiscount(booking.total_amount || 0);
                    return (
                      <div className="mt-1 text-green-700 font-semibold">
                        Volume Discount: {discountInfo.percent}%<br />
                        Discounted Total: ${discounted.toFixed(2)}
                      </div>
                    );
                  } else {
                    return <div className="mt-1 text-gray-500">No volume discount applied</div>;
                  }
                })()}
              </>
            )}
          </div>
          {/* Media Files */}
          <div className="bg-white rounded-lg p-6 border w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>Media Files</span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={createProjectFolders}
                disabled={creatingFolders || !form.address || form.raw_photos_link || form.final_edits_link}
                className="flex items-center gap-2"
              >
                {creatingFolders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderPlus className="h-4 w-4" />
                )}
                {form.raw_photos_link || form.final_edits_link ? "Project Files Created" : "Create Project Files"}
              </Button>
            </div>
            <div className="space-y-6">
              {/* Raw Photo Folder */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <span className="flex items-center gap-2 min-w-[160px] font-medium text-gray-700">
                  <span className="text-xl">📁</span> Raw Brackets
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full md:w-auto"
                      placeholder="Paste Google Drive/Dropbox link..."
                      value={form.raw_photos_link || ''}
                      onChange={e => handleChange('raw_photos_link', e.target.value)}
                    />
                  ) : (
                    form.raw_photos_link ? (
                      <TruncatedLink href={form.raw_photos_link}>
                        {form.raw_photos_link}
                      </TruncatedLink>
                    ) : (
                      <span 
                        className="text-gray-400 italic cursor-pointer hover:text-gray-600" 
                        onClick={() => {
                          setEditing(true);
                          // Focus the input after a short delay to ensure it's rendered
                          setTimeout(() => {
                            const input = document.querySelector('input[placeholder="Paste Google Drive/Dropbox link..."]') as HTMLInputElement;
                            if (input) input.focus();
                          }, 100);
                        }}
                      >
                        No link added yet
                      </span>
                    )
                  )}
                  <Button
                    size="sm"
                    className="w-full md:w-auto"
                    variant="outline"
                    onClick={() => form.raw_photos_link && window.open(form.raw_photos_link, '_blank')}
                    disabled={!form.raw_photos_link}
                  >
                    Open Folder
                  </Button>
                </div>
              </div>
              {/* Final Edited Media Folder */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <span className="flex items-center gap-2 min-w-[160px] font-medium text-gray-700">
                  <span className="text-xl">🎞️</span> Edited Media
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full md:w-auto"
                      placeholder="Paste Google Drive/Dropbox link..."
                      value={form.final_edits_link || ''}
                      onChange={e => handleChange('final_edits_link', e.target.value)}
                    />
                  ) : (
                    form.final_edits_link ? (
                      <TruncatedLink href={form.final_edits_link}>
                        {form.final_edits_link}
                      </TruncatedLink>
                    ) : (
                      <span 
                        className="text-gray-400 italic cursor-pointer hover:text-gray-600" 
                        onClick={() => {
                          setEditing(true);
                          // Focus the input after a short delay to ensure it's rendered
                          setTimeout(() => {
                            const inputs = document.querySelectorAll('input[placeholder="Paste Google Drive/Dropbox link..."]');
                            const input = inputs[1] as HTMLInputElement;
                            if (input) input.focus();
                          }, 100);
                        }}
                      >
                        No link added yet
                      </span>
                    )
                  )}
                  <Button
                    size="sm"
                    className="w-full md:w-auto"
                    variant="outline"
                    onClick={() => form.final_edits_link && window.open(form.final_edits_link, '_blank')}
                    disabled={!form.final_edits_link}
                  >
                    Open Final Files
                  </Button>
                </div>
              </div>
              {/* 360 Tour Link */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <span className="flex items-center gap-2 min-w-[160px] font-medium text-gray-700">
                  <span className="text-xl">🌏</span> 360 Tour Link
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full md:w-auto"
                      placeholder="Paste 360 tour link..."
                      value={form.tour_360_link || ''}
                      onChange={e => handleChange('tour_360_link', e.target.value)}
                    />
                  ) : (
                    form.tour_360_link ? (
                      <TruncatedLink href={form.tour_360_link}>
                        {form.tour_360_link}
                      </TruncatedLink>
                    ) : (
                      <span 
                        className="text-gray-400 italic cursor-pointer hover:text-gray-600" 
                        onClick={() => {
                          setEditing(true);
                          // Focus the input after a short delay to ensure it's rendered
                          setTimeout(() => {
                            const input = document.querySelector('input[placeholder="Paste 360 tour link..."]') as HTMLInputElement;
                            if (input) input.focus();
                          }, 100);
                        }}
                      >
                        No link added yet
                      </span>
                    )
                  )}
                  <Button
                    size="sm"
                    className="w-full md:w-auto"
                    variant="outline"
                    onClick={() => form.tour_360_link && window.open(form.tour_360_link, '_blank')}
                    disabled={!form.tour_360_link}
                  >
                    View 360 Tour
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Management Links */}
          <div className="bg-white rounded-lg p-6 border w-full">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>Management Links</span>
            </h2>
            <div className="space-y-6">
              {/* Editor Link */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <span className="flex items-center gap-2 min-w-[160px] font-medium text-gray-700">
                  <span className="text-xl">✏️</span> Editor Link
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full md:w-auto"
                      placeholder="Paste editor link..."
                      value={form.editor_link || ''}
                      onChange={e => handleChange('editor_link', e.target.value)}
                    />
                  ) : (
                    form.editor_link ? (
                      <TruncatedLink href={form.editor_link}>
                        {form.editor_link}
                      </TruncatedLink>
                    ) : (
                      <span 
                        className="text-gray-400 italic cursor-pointer hover:text-gray-600" 
                        onClick={() => {
                          setEditing(true);
                          // Focus the input after a short delay to ensure it's rendered
                          setTimeout(() => {
                            const input = document.querySelector('input[placeholder="Paste editor link..."]') as HTMLInputElement;
                            if (input) input.focus();
                          }, 100);
                        }}
                      >
                        No link added yet
                      </span>
                    )
                  )}
                  <Button
                    size="sm"
                    className="w-full md:w-auto"
                    variant="outline"
                    onClick={() => window.open(form.editor_link || "https://app.pixlmob.com/maidanghung", '_blank')}
                    disabled={false}
                  >
                    Open Editor
                  </Button>
                </div>
              </div>
              {/* Client Delivery Page */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <span className="flex items-center gap-2 min-w-[160px] font-medium text-gray-700">
                  <span className="text-xl">🌐</span> Delivery Link (Client Delivery)
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full md:w-auto"
                      placeholder="Paste delivery page link..."
                      value={form.delivery_page_link || ''}
                      onChange={e => handleChange('delivery_page_link', e.target.value)}
                    />
                  ) : (
                    form.delivery_page_link ? (
                      <TruncatedLink href={form.delivery_page_link}>
                        {form.delivery_page_link}
                      </TruncatedLink>
                    ) : (
                      <span 
                        className="text-gray-400 italic cursor-pointer hover:text-gray-600" 
                        onClick={() => {
                          setEditing(true);
                          // Focus the input after a short delay to ensure it's rendered
                          setTimeout(() => {
                            const input = document.querySelector('input[placeholder="Paste delivery page link..."]') as HTMLInputElement;
                            if (input) input.focus();
                          }, 100);
                        }}
                      >
                        No link added yet
                      </span>
                    )
                  )}
                  <Button
                    size="sm"
                    className="w-full md:w-auto"
                    variant="outline"
                    onClick={() => form.delivery_page_link && window.open(form.delivery_page_link, '_blank')}
                    disabled={!form.delivery_page_link}
                  >
                    View Page
                  </Button>
                </div>
              </div>
              {/* Invoice Link */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <span className="flex items-center gap-2 min-w-[160px] font-medium text-gray-700">
                  <span className="text-xl">📄</span> Invoice Link
                </span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full md:w-auto"
                      placeholder="Paste invoice link..."
                      value={form.invoice_link || ''}
                      onChange={e => handleChange('invoice_link', e.target.value)}
                    />
                  ) : (
                    form.invoice_link ? (
                      <TruncatedLink href={form.invoice_link}>
                        {form.invoice_link}
                      </TruncatedLink>
                    ) : (
                      <span 
                        className="text-gray-400 italic cursor-pointer hover:text-gray-600" 
                        onClick={() => {
                          setEditing(true);
                          // Focus the input after a short delay to ensure it's rendered
                          setTimeout(() => {
                            const input = document.querySelector('input[placeholder="Paste invoice link..."]') as HTMLInputElement;
                            if (input) input.focus();
                          }, 100);
                        }}
                      >
                        No link added yet
                      </span>
                    )
                  )}
                  <Button
                    size="sm"
                    className="w-full md:w-auto"
                    variant="outline"
                    onClick={() => form.invoice_link && window.open(form.invoice_link, '_blank')}
                    disabled={!form.invoice_link}
                  >
                    View Invoice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add the email modal */}
      <CreateMediaDeliveryEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        booking={booking}
        onEmailSent={handleEmailSent}
      />
    </div>
  )
} 