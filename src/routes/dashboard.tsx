import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { UserMenu } from '@/components/user-menu'
import NotFound from '@/components/ui/not-found'

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

function DashboardLayout() {
    const { user } = Route.useRouteContext()

    return (
        <div className="relative min-h-screen">
            <div className="absolute top-4 left-4 z-[100]">
                <UserMenu user={user} />
            </div>
            <Outlet />
        </div >
    )
}
