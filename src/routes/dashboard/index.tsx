import { createFileRoute, useNavigate } from '@tanstack/react-router'
import PersonallyLogo from '@/components/logo'
import { Separator } from '@/components/ui/separator'
import {
  BellRing,
  ClipboardList,
  Flag,
  Folder,
  Plus,
  StickyNote,
  Trophy,
} from 'lucide-react'
import { Suspense, useState } from 'react'
import {
  ActionItem,
  CreateNewProjectBox,
} from '@/components/project/create-new'
import StatisticCard3 from '@/components/ui/statistics-card'
import LineChart6 from '@/components/line-chart-6'
import CreateNewProjectDialog from '@/features/project/create-new-project-dialog'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  ssr: true,
})

function RouteComponent() {
  return (
    <div className="min-h-screen flex flex-col ">
      <div className="flex-1 flex items-center justify-center px-4 py-2 sm:py-10">
        <div className="w-full max-w-2xl items-center justify-center flex">
          <PersonallyLogo width="350" height="40" />
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/50" />
      </div>

      {/* Add Project Button Section */}
      <div className="flex items-center justify-center px-4 py-8 sm:py-12">
        <AddProjectComponent />
      </div>

      {/* Loan Component */}
      <div className="w-full min-h-[600px] px-4 py-8">
        <Suspense fallback={<div className="h-[300px]" />}>
          <LineChart6 />
        </Suspense>
      </div>

      <div className="relative my-4 flex items-center justify-center overflow-hidden">
        <Separator />
        <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
          Income/Expenses
        </div>
        <Separator />
      </div>

      {/* Income/Expenses Component */}
      <div className="w-full min-h-[600px] px-4 py-8">
        <StatisticCard3 />
      </div>
    </div>
  )
}

function AddProjectComponent() {
  const navigate = useNavigate()
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

  const actionItems: ActionItem[] = [
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
      {isProjectDialogOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <CreateNewProjectDialog
            open={isProjectDialogOpen}
            onOpenChange={setIsProjectDialogOpen}
          />
        </Suspense>
      )}
    </>
  )
}
