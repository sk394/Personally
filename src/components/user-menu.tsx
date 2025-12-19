import { Link } from '@tanstack/react-router'
import { Bell, Check, LayoutDashboard, LogOut, User, X } from 'lucide-react'
import { authClient } from '@/lib/auth/auth-client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTRPC } from '@/integrations/trpc/react'
import { useInvitationNotifications } from '@/hooks/use-invitation-notifications'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export function UserMenu({ user }: { user: any }) {
    const trpc = useTRPC()
    const {
        data: invitations = []
    } = useQuery(trpc.project.getPendingInvitations.queryOptions())
    const {
        handleAccept,
        handleDecline,
        isActionLoading,
    } = useInvitationNotifications()

    const unreadCount = invitations.filter((inv) => !inv.notificationRead).length

    const handleLogout = async () => {
        await authClient.signOut()
        window.location.href = '/'
    }

    const projectTypeConfig = {
        loan: { label: 'Loan', emoji: '💰' },
        splitwise: { label: 'Splitwise', emoji: '🧾' },
        general: { label: 'General', emoji: '📁' },
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50 backdrop-blur-md transition-transform hover:scale-105 active:scale-95">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>
                            <User size={16} />
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start"
                className="max-w-xs rounded-2xl p-1.5 bg-popover border-border">
                <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-[calc(1rem-6px)] text-xs">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <LayoutDashboard size={14} />
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="rounded-[calc(1rem-6px)] text-xs">
                            <Bell size={14} />
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <Badge variant="outline" className="animate-ping text-xs h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
                                    {unreadCount}
                                </Badge>
                            )}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-80 max-h-96 overflow-y-auto rounded-2xl p-2">
                            {invitations.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    No pending invitations
                                </div>
                            ) : (
                                invitations.map((invitation) => {
                                    const config = projectTypeConfig[invitation.projectType as keyof typeof projectTypeConfig]
                                    return (
                                        <div
                                            key={invitation.id}
                                            className={cn(
                                                "mb-2 last:mb-0 rounded-lg border p-3 space-y-2",
                                                !invitation.notificationRead && "bg-blue-50/50 border-blue-200"
                                            )}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-base">{config.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {config.label}
                                                        </Badge>
                                                        {!invitation.notificationRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        {invitation.inviterName} invited you to
                                                    </p>
                                                    <p className="text-sm font-medium truncate">
                                                        {invitation.projectName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="flex-1 h-7 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAccept(invitation.id)
                                                    }}
                                                    disabled={isActionLoading}
                                                >
                                                    <Check size={12} className="mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-7 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDecline(invitation.id)
                                                    }}
                                                    disabled={isActionLoading}
                                                >
                                                    <X size={12} className="mr-1" />
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive rounded-[calc(1rem-6px)] text-xs">
                        <LogOut size={14} className="mr-2" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
