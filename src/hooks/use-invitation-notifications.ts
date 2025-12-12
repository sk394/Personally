import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'
import { useTRPC } from '@/integrations/trpc/react'

export function useInvitationNotifications() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Accept invitation mutation
  const acceptMutation = useMutation({
    ...trpc.project.acceptInvitation.mutationOptions(),
    onSuccess: () => {
      toast.success('Invitation accepted! You are now a member of the project.')
      queryClient.invalidateQueries({ queryKey: [['project', 'getPendingInvitations']] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to accept invitation')
    },
  })

  // Decline invitation mutation
  const declineMutation = useMutation({
    ...trpc.project.declineInvitation.mutationOptions(),
    onSuccess: () => {
      toast.success('Invitation declined')
      queryClient.invalidateQueries({ queryKey: [['project', 'getPendingInvitations']] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to decline invitation')
    },
  })

  // Mark notification as read mutation
  const markReadMutation = useMutation({
    ...trpc.project.markNotificationRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['project', 'getPendingInvitations']] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to mark notification as read')
    },
  })

  // Dismiss notification mutation
  const dismissMutation = useMutation({
    ...trpc.project.dismissNotification.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['project', 'getPendingInvitations']] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to dismiss notification')
    },
  })

  const handleAccept = (invitationId: string) => {
    acceptMutation.mutate({ invitationId })
  }

  const handleDecline = (invitationId: string) => {
    declineMutation.mutate({ invitationId })
  }

  const handleDismiss = (invitationId: string) => {
    dismissMutation.mutate({
      invitationId,
      markAsRead: true,
      dismiss: true,
    })
  }

  const handleMarkRead = (invitationId: string) => {
    markReadMutation.mutate({ invitationId })
  }

  const isActionLoading =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    dismissMutation.isPending ||
    markReadMutation.isPending

  return {
    handleAccept,
    handleDecline,
    handleDismiss,
    handleMarkRead,
    isActionLoading,
  }
}
