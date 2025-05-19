import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateEmailModalProps {
  isOpen: boolean
  onClose: () => void
  booking: any
  onEmailSent: () => void
}

const EMAIL_TEMPLATES = {
  'media-delivery': {
    name: 'Media Delivery',
    generateContent: (booking: any) => {
      const propertyAddress = booking.property_address || "Property"
      const agentName = booking.agent_name || "Agent"
      
      return {
        subject: `Media Delivery - ${propertyAddress}`,
        message: `Dear ${agentName},

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
      }
    }
  },
  'invoice': {
    name: 'Invoice',
    generateContent: (booking: any) => {
      const propertyAddress = booking.property_address || "Property"
      const agentName = booking.agent_name || "Agent"
      
      return {
        subject: `Invoice for ${propertyAddress}`,
        message: `Dear ${agentName},

Please find attached the invoice for the media services provided for ${propertyAddress}.

Invoice Link: ${booking.invoice_link || "Link not available"}

If you have any questions about the invoice, please don't hesitate to contact us.

Best regards,
Your Media Team`
      }
    }
  },
  'follow-up': {
    name: 'Follow Up',
    generateContent: (booking: any) => {
      const propertyAddress = booking.property_address || "Property"
      const agentName = booking.agent_name || "Agent"
      
      return {
        subject: `Follow Up - ${propertyAddress}`,
        message: `Dear ${agentName},

I hope this email finds you well. I wanted to follow up regarding the media content we provided for ${propertyAddress}.

Is there anything else you need or any adjustments required?

Best regards,
Your Media Team`
      }
    }
  }
}

export function CreateEmailModal({
  isOpen,
  onClose,
  booking,
  onEmailSent
}: CreateEmailModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("media-delivery")

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES]
    const { subject, message } = template.generateContent(booking)
    setSubject(subject)
    setMessage(message)
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
      handleTemplateChange(selectedTemplate)
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Create Email
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-muted-foreground">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select a template and customize your email before sending.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TEMPLATES).map(([id, template]) => (
                  <SelectItem key={id} value={id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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