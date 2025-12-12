import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Crown,
    Mail,
    Shield,
    Trash2,
    User,
    UserPlus,
    Users,
    X,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { InviteMemberComponent } from './invite-member'
import { useTRPC } from '@/integrations/trpc/react'

interface MemberManagementProps {
    projectId: string
    projectTitle: string
    currentUserId: string
    isOwner: boolean
}

export function MemberManagement({
    projectId,
    projectTitle,
    currentUserId,
    isOwner,
}: MemberManagementProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
    const [invitationToCancel, setInvitationToCancel] = useState<string | null>(
        null,
    )

    const { data: members, isLoading: membersLoading } = useQuery(
        trpc.project.getMembers.queryOptions({ projectId }),
    )

    const { data: invitations } = useQuery(
        trpc.project.getInvitations.queryOptions({ projectId }),
    )

    const removeMemberMutation = useMutation(
        trpc.project.removeMember.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['project', 'getMembers']],
                })
                toast.success('Member removed successfully')
                setMemberToRemove(null)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to remove member')
            },
        }),
    )

    const cancelInvitationMutation = useMutation(
        trpc.project.cancelInvitation.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['project', 'getInvitations']],
                })
                toast.success('Invitation cancelled')
                setInvitationToCancel(null)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to cancel invitation')
            },
        }),
    )

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Crown className="size-3" />
            case 'admin':
                return <Shield className="size-3" />
            case 'member':
                return <User className="size-3" />
            default:
                return <User className="size-3" />
        }
    }

    const getRoleBadgeVariant = (role: string): 'secondary' | 'outline' => {
        switch (role) {
            case 'owner':
                return 'secondary'
            case 'admin':
                return 'secondary'
            default:
                return 'outline'
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getInvitationStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="size-3" />
            case 'accepted':
                return <CheckCircle className="size-3" />
            case 'declined':
                return <XCircle className="size-3" />
            default:
                return <Clock className="size-3" />
        }
    }

    const getInvitationStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            case 'accepted':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            case 'declined':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="size-6" />
                        Team Members
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage who has access to this project
                    </p>
                </div>
                {(isOwner || true) && (
                    <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                        <UserPlus className="size-4" />
                        Invite Member
                    </Button>
                )}
            </div>

            {/* Current Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Active Members ({members?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {membersLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Loading members...
                        </p>
                    ) : members && members.length > 0 ? (
                        <div className="space-y-3">
                            {members.map((member: any) => {
                                const isCurrentUser = member.userId === currentUserId
                                const canRemove =
                                    isOwner && !isCurrentUser && member.role !== 'owner'

                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {getInitials(member.user?.name || member.user?.email || 'U')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">
                                                        {member.user?.name || 'Unknown User'}
                                                    </p>
                                                    {isCurrentUser && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            You
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {member.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={getRoleBadgeVariant(member.role)}
                                                className="gap-1"
                                            >
                                                {getRoleIcon(member.role)}
                                                {member.role}
                                            </Badge>
                                            {canRemove && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setMemberToRemove(member.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No members yet
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Pending Invitations ({invitations.filter((i: any) => i.status === 'pending').length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {invitations
                                .filter((inv: any) => inv.status === 'pending')
                                .map((invitation: any) => (
                                    <div
                                        key={invitation.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-muted">
                                                <Mail className="size-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{invitation.invitedName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {invitation.invitedEmail}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`gap-1 ${getInvitationStatusColor(invitation.status)}`}
                                            >
                                                {getInvitationStatusIcon(invitation.status)}
                                                {invitation.status}
                                            </Badge>
                                            {isOwner && invitation.status === 'pending' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setInvitationToCancel(invitation.id)}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Invite Dialog */}
            <InviteMemberComponent
                projectId={projectId}
                projectTitle={projectTitle}
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
            />

            {/* Remove Member Confirmation */}
            <AlertDialog
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This member will lose access to the project immediately. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (memberToRemove) {
                                    removeMemberMutation.mutate({
                                        projectId,
                                        memberId: memberToRemove,
                                    })
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove Member
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Invitation Confirmation */}
            <AlertDialog
                open={!!invitationToCancel}
                onOpenChange={(open) => !open && setInvitationToCancel(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This invitation will be cancelled and the recipient won't be able
                            to accept it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (invitationToCancel) {
                                    cancelInvitationMutation.mutate({
                                        invitationId: invitationToCancel,
                                    })
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Cancel Invitation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
