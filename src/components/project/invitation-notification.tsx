import { Check, Clock, Minus, User, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface InvitationNotificationData {
  id: string
  projectId: string
  projectName: string
  projectType: 'loan' | 'splitwise' | 'general'
  inviterName: string
  invitedAt: Date
  expiresAt: Date
  notificationRead: boolean
  notificationDismissed: boolean
}

interface InvitationNotificationProps {
  invitation: InvitationNotificationData
  onAccept: (invitationId: string) => void
  onDecline: (invitationId: string) => void
  onDismiss: (invitationId: string) => void
  onMarkRead?: (invitationId: string) => void
  isLoading?: boolean
}

const projectTypeConfig = {
  loan: {
    label: 'Loan',
    color: 'bg-blue-100 text-blue-800',
    icon: '💰',
  },
  splitwise: {
    label: 'Splitwise',
    color: 'bg-green-100 text-green-800',
    icon: '🧾',
  },
  general: {
    label: 'General',
    color: 'bg-gray-100 text-gray-800',
    icon: '📁',
  },
}

export function InvitationNotification({
  invitation,
  onAccept,
  onDecline,
  onDismiss,
  onMarkRead,
  isLoading = false,
}: InvitationNotificationProps) {
  const config = projectTypeConfig[invitation.projectType]
  const timeAgo = formatDistanceToNow(invitation.invitedAt, { addSuffix: true })
  const expiresIn = formatDistanceToNow(invitation.expiresAt, {
    addSuffix: true,
  })

  const handleCardClick = () => {
    // Mark as read when user interacts with the notification
    if (!invitation.notificationRead && onMarkRead) {
      onMarkRead(invitation.id)
    }
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer',
        !invitation.notificationRead && 'ring-2 ring-blue-200 bg-blue-50/50',
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{config.icon}</span>
              <Badge variant="secondary" className={config.color}>
                {config.label}
              </Badge>
              {!invitation.notificationRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                <User className="inline w-4 h-4 mr-1" />
                {invitation.inviterName} invited you to join
              </p>
              <p className="text-base font-semibold text-gray-900 truncate">
                {invitation.projectName}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo}
                </span>
                <span>Expires {expiresIn}</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDismiss(invitation.id)}
            disabled={isLoading}
            className="shrink-0 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onAccept(invitation.id)}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button
            onClick={() => onDecline(invitation.id)}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-1" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
