import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface CreateMediaDeliveryEmailModalProps {
  isOpen: boolean
  onClose: () => void
  booking: any
  onEmailSent: () => void
}

export function CreateMediaDeliveryEmailModal({
  isOpen,
  onClose,
  booking,
  onEmailSent
}: CreateMediaDeliveryEmailModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  // Generate pre-filled email content
  const generateEmailContent = () => {
    const propertyAddress = booking.property_address || "Property"
    const agentName = booking.agent_name || "Agent"
    
    const defaultSubject = `Media Delivery - ${propertyAddress}`
    const defaultMessage = `Dear ${agentName},

I hope this email finds you well. I am pleased to inform you that the media content for ${propertyAddress} is now ready for delivery.

The media package includes:
- High-resolution photographs
- Virtual tour
- Floor plans
- Property video

You can access the media content through the following Dropbox links:
${booking.dropbox_links?.raw_brackets || "Raw Brackets: Link not available"}
${booking.dropbox_links?.edited_media || "Edited Media: Link not available"}

Please review the content and let me know if you need any adjustments or have any questions.

Best regards,
Your Media Team`

    setSubject(defaultSubject)
    setMessage(defaultMessage)
  }

  const handleSendEmail = async () => {
    try {
      setIsSending(true)
      
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: booking.agent_email,
          subject,
          message,
          bookingId: booking.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast.success("Email sent successfully")
      onEmailSent()
      onClose()
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send email")
    } finally {
      setIsSending(false)
    }
  }

  // Generate email content when modal opens
  useState(() => {
    if (isOpen) {
      generateEmailContent()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            New Email
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-muted-foreground">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send your final media, invoice, and message to the client directly from here.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              value={booking.agent_email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[200px]"
              placeholder="Enter email message"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 