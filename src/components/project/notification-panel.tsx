import { useState } from 'react'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'
import {
  InvitationNotification
} from './invitation-notification'
import type {
  InvitationNotificationData
} from './invitation-notification';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

interface NotificationPanelProps {
  invitations: Array<InvitationNotificationData>
  onAccept: (invitationId: string) => void
  onDecline: (invitationId: string) => void
  onDismiss: (invitationId: string) => void
  onMarkRead?: (invitationId: string) => void
  isLoading?: boolean
}

export function NotificationPanel({
  invitations,
  onAccept,
  onDecline,
  onDismiss,
  onMarkRead,
  isLoading = false,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Filter out dismissed notifications
  const visibleInvitations = invitations.filter(
    (inv) => !inv.notificationDismissed,
  )
  const unreadCount = visibleInvitations.filter(
    (inv) => !inv.notificationRead,
  ).length

  if (visibleInvitations.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5" />
                Project Invitations
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {visibleInvitations.map((invitation) => (
                <InvitationNotification
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={onAccept}
                  onDecline={onDecline}
                  onDismiss={onDismiss}
                  onMarkRead={onMarkRead}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
