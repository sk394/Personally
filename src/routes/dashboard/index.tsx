import { createFileRoute, useNavigate, Link, ClientOnly } from '@tanstack/react-router'
import {
  BellRing,
  ClipboardList,
  Flag,
  Folder,
  StickyNote,
  Trophy,
  ArrowRight,
} from 'lucide-react'
import { useState, lazy, Suspense } from 'react'
import type { ActionItem } from '@/components/project/create-new'
import PersonallyLogo from '@/components/logo'
import { useInvitationNotifications } from '@/hooks/use-invitation-notifications'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'

const NotificationPanel = lazy(() =>
  import('@/components/project/notification-panel').then((module) => ({
    default: module.NotificationPanel,
  })),
)

const EmptyDashboard = lazy(() =>
  import('@/components/project/empty-dashboard').then((module) => ({
    default: module.EmptyDashboard,
  })),
)

const CreateNewProjectBox = lazy(() =>
  import('@/components/project/create-new'),
)

const CreateNewProjectDialog = lazy(() =>
  import('@/features/project/create-new-project-dialog').then((module) => ({
    default: module.CreateNewProjectDialog,
  })),
)

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  ssr: true,
  loader: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(
      context.trpc.user.getSession.queryOptions(),
    )
    await context.queryClient.prefetchQuery(
      context.trpc.project.getAll.queryOptions(),
    )
    await context.queryClient.prefetchQuery(
      context.trpc.project.getPendingInvitations.queryOptions(),
    )

    return {
      user: session?.user
    }
  },
})

function RouteComponent() {
  const { user } = Route.useLoaderData()
  const trpc = useTRPC()

  const { data: projectsData, isLoading: projectsLoading } =
    useQuery(trpc.project.getAll.queryOptions())

  // Get pending invitations
  const {
    data: invitations = []
  } = useQuery(trpc.project.getPendingInvitations.queryOptions())

  const {
    handleAccept,
    handleDecline,
    handleDismiss,
    handleMarkRead,
    isActionLoading,
  } = useInvitationNotifications()

  // Calculate total projects (owned + member)
  const totalProjects =
    (projectsData?.owned.length || 0) + (projectsData?.member.length || 0)

  // Show loading state
  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full text-center space-y-4">
          <PersonallyLogo width="350" height="40" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col ">
      {user && (
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">User: {user.name}</p>
          <p className="text-lg font-semibold">Email: {user.email}</p>
        </div>
      )}
      {/* Notification Panel */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>}>
          <NotificationPanel
            invitations={invitations}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onDismiss={handleDismiss}
            onMarkRead={handleMarkRead}
            isLoading={isActionLoading}
          />
        </Suspense>
      </div>

      {totalProjects === 0 ? (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading dashboard...</p></div>}>
          <EmptyDashboard />
        </Suspense>
      ) : (
        <>
          {/* View All Projects Link */}
          <div className="flex items-center justify-center px-4 py-4">
            <Link
              to="/dashboard/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              View all your projects ({totalProjects})
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Add Project Button Section */}
          <div className="flex items-center justify-center px-4 py-8 sm:py-12">
            <Suspense fallback={<div className="h-12 w-32 bg-gray-100 rounded animate-pulse" />}>
              <AddProjectComponent />
            </Suspense>
          </div>

          {/* Loan Component */}
          {/* <div className="w-full min-h-[600px] px-4 py-8">
            <LineChart6 />
          </div>

          <div className="relative my-4 flex items-center justify-center overflow-hidden">
            <Separator />
            <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
              Income/Expenses
            </div>
            <Separator />
          </div> */}

          {/* Income/Expenses Component */}
          <div className="w-full min-h-[600px] px-4 py-8">
            {/* <StatisticCard3 /> */}
          </div>
        </>
      )}
    </div>
  )
}

function AddProjectComponent() {
  const navigate = useNavigate()
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

  const actionItems: Array<ActionItem> = [
    {
      id: 'project',
      icon: <Folder />,
      name: 'Project',
      onClick: () => setIsProjectDialogOpen(true),
    },
    {
      id: 'loans',
      icon: <ClipboardList />,
      name: 'Loans',
      onClick: () => navigate({ to: '/dashboard/loan' }),
    },
    {
      id: 'splitwise',
      icon: <StickyNote />,
      name: 'Splitwise',
      onClick: () => navigate({ to: '/dashboard/splitwise' }),
    },
    {
      id: 'expense',
      icon: <Trophy />,
      name: 'Personal Expense',
      onClick: () => navigate({ to: '/dashboard/expense' }),
    },
    {
      id: 'income',
      icon: <Flag />,
      name: 'Income',
      onClick: () => navigate({ to: '/dashboard/income' }),
    },
    {
      id: 'reminder',
      icon: <BellRing />,
      name: 'Reminder',
      onClick: () => navigate({ to: '/dashboard/reminder' }),
    },
  ]

  return (
    <>
      <CreateNewProjectBox
        actions={actionItems}
        onActionClick={(action) => action.onClick && action.onClick()}
        label="Add New Project"
        theme={{
          buttonText: 'text-blue-900',
          buttonHoverBg: 'hover:bg-blue-200',
          itemBg: 'bg-black/5',
          itemHoverBg: 'hover:bg-blue-50',
        }}
      />
      <CreateNewProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
      />
    </>
  )
}
