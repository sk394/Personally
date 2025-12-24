import { createFileRoute, Outlet, redirect, Link } from '@tanstack/react-router'
import { UserMenu } from '@/components/user-menu'
import NotFound from '@/components/ui/not-found'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Bell, X } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
    beforeLoad: async ({ context }) => {
        const session = await context.queryClient.fetchQuery(
            context.trpc.user.getSession.queryOptions(),
        )
        if (!session) {
            throw redirect({
                to: '/signin',
            })
        }
        return {
            user: session?.user,
        }
    },
    component: DashboardLayout,
    loader: async ({ context }) => {
        await context.queryClient.prefetchQuery(
            context.trpc.project.getPendingInvitations.queryOptions(),
        )
    },
    notFoundComponent: () => <div><NotFound /></div>,
})

function NotificationBar() {
    const trpc = useTRPC()
    const { data: invitations } = useQuery(trpc.project.getPendingInvitations.queryOptions())
    const [isDismissed, setIsDismissed] = useState(false)

    // Count unread notifications
    const unreadCount = invitations?.filter((inv) => !inv.notificationRead && !inv.notificationDismissed).length ?? 0

    if (unreadCount === 0 || isDismissed) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-center relative">
            <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">
                    You have {unreadCount} {unreadCount === 1 ? 'notification' : 'notifications'}, Click on User icon to view.
                </span>
            </div>
        </div>
    )
}

function DashboardLayout() {
    const { user } = Route.useRouteContext()

    return (
        <div className="relative min-h-screen">
            <NotificationBar />
            <div className="absolute top-4 left-4 z-[100]">
                <UserMenu user={user} />
            </div>
            <Outlet />
        </div >
    )
}
