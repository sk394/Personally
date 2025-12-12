import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
  Calendar,
  DollarSign,
  Loader2,
  Plus,
  TrendingDown,
  TrendingUp,
  User,
  ArrowLeft,
} from 'lucide-react'
import { useState } from 'react'
import type { Loan } from '@/lib/db/schema'
import PersonallyLogo from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreateNewLoanDialog } from '@/features/loan/create-new-loan-dialog'
import { GetStatusBadge } from '@/features/loan/status-badge'
import { useTRPC } from '@/integrations/trpc/react'
import { auth } from '@/lib/auth/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

const authStateFn = createServerFn({ method: 'GET' }).handler(async ({}) => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) {
    throw redirect({
      to: '/signin',
    })
  }

  return { userId: session.user?.id }
})

export const Route = createFileRoute('/dashboard/loan/$projectId')({
  component: RouteComponent,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context, params }) => {
    const { userId } = await authStateFn()

    // Prefetch project data to validate access and type
    await context.queryClient.prefetchQuery(
      context.trpc.project.getById.queryOptions({
        id: params.projectId,
        expectedType: 'loan',
      }),
    )

    // Prefetch loan data for this specific project
    await context.queryClient.prefetchQuery(
      context.trpc.loan.getAll.queryOptions(),
    )

    return { userId, projectId: params.projectId }
  },
  errorComponent: ({ error }) => {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'You do not have access to this loan project.'}
        </p>
        <Link to="/dashboard">
          <Button>
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  },
})

function RouteComponent() {
  const { userId, projectId } = Route.useLoaderData()
  const trpc = useTRPC()
  const [loanDialogOpen, setLoanDialogOpen] = useState(false)

  // Query project data with access control
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery(
    trpc.project.getById.queryOptions({
      id: projectId,
      expectedType: 'loan',
    }),
  )

  // Query loans filtered by project ID
  const { data: allLoans, isLoading: isLoansLoading } = useQuery(
    trpc.loan.getAll.queryOptions(),
  )

  // Filter loans for this specific project
  const projectLoans = allLoans?.filter(loan => loan.projectId === projectId) || []

  // Separate borrowed and lent loans
  const borrowedLoans = projectLoans.filter((loan) => loan.type === 'borrowed')
  const lentLoans = projectLoans.filter((loan) => loan.type === 'lent')

  // Handle project access errors
  if (projectError) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You do not have access to this loan project.
        </p>
        <Link to="/dashboard">
          <Button>
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  if (isProjectLoading) {
    return <LoadingBar />
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The loan project you're looking for doesn't exist.
        </p>
        <Link to="/dashboard">
          <Button>
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const isLoading = isLoansLoading

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex-1 flex items-center justify-center px-4 py-2 sm:py-10">
        <div className="w-full max-w-2xl items-center justify-center flex">
          <PersonallyLogo width="350" height="40" />
        </div>
      </div>
      
      <div className="relative my-4 flex items-center justify-center overflow-hidden">
        <Separator className="bg-border/50" />
        <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
          Loan Project
        </div>
        <Separator className="bg-border/50" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <p className="text-muted-foreground">
            {project.description || 'Track money you\'ve borrowed and lent'}
          </p>
        </div>
        <Button size="lg" onClick={() => setLoanDialogOpen(true)}>
          <Plus className="size-5" />
          Add Loan
        </Button>
      </div>

      {isLoading ? (
        <LoadingBar />
      ) : projectLoans.length === 0 ? (
        <EmptyLoans onCreateLoan={() => setLoanDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Borrowed Loans */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="size-5 text-red-500" />
              Borrowed ({borrowedLoans.length})
            </h2>
            <div className="space-y-4">
              {borrowedLoans.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No borrowed loans
                  </CardContent>
                </Card>
              ) : (
                borrowedLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} cardType="borrowed" />
                ))
              )}
            </div>
          </div>

          {/* Lent Loans */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-green-500" />
              Lent ({lentLoans.length})
            </h2>
            <div className="space-y-4">
              {lentLoans.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No lent loans
                  </CardContent>
                </Card>
              ) : (
                lentLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} cardType="lent" />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <CreateNewLoanDialog
        open={loanDialogOpen}
        onOpenChange={setLoanDialogOpen}
        projectId={projectId}
      />
    </div>
  )
}

export function LoanCard({
  loan,
  cardType,
}: {
  loan: Pick<
    Loan,
    | 'id'
    | 'contactName'
    | 'contactEmail'
    | 'principalAmount'
    | 'totalPaid'
    | 'currency'
    | 'status'
    | 'loanDate'
    | 'dueDate'
    | 'hasInterest'
    | 'interestRate'
  >
  cardType?: 'borrowed' | 'lent'
}) {
  return (
    <Card
      key={loan.id}
      className="hover:shadow-lg transition-shadow cursor-pointer"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-full ${cardType === 'borrowed' ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'} flex items-center justify-center`}
            >
              <User
                className={`size-5 ${cardType === 'borrowed' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{loan.contactName}</CardTitle>
              {loan.contactEmail && (
                <CardDescription className="text-xs">
                  {loan.contactEmail}
                </CardDescription>
              )}
            </div>
          </div>
          <GetStatusBadge status={loan.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span
              className={`text-lg font-bold ${cardType === 'borrowed' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
            >
              {formatCurrency(loan.principalAmount, loan.currency)}
            </span>
          </div>
          {loan.totalPaid > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrency(loan.totalPaid, loan.currency)}
              </span>
            </div>
          )}
          {loan.totalPaid > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((loan.totalPaid / loan.principalAmount) * 100, 100)}%`,
                }}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(loan.loanDate)}
            </div>
            {loan.dueDate && (
              <div className="flex items-center gap-1">
                Due: {formatDate(loan.dueDate)}
              </div>
            )}
          </div>
          {loan.hasInterest && loan.interestRate && (
            <div className="text-xs text-muted-foreground">
              Interest: {(loan.interestRate * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoadingBar() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export function EmptyLoans({ onCreateLoan }: { onCreateLoan: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <DollarSign className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No loans yet</h3>
        <p className="text-muted-foreground text-center mb-4">
          Start tracking money you've borrowed or lent in this project
        </p>
        <Button onClick={onCreateLoan}>
          <Plus className="size-4" />
          Create Your First Loan
        </Button>
      </CardContent>
    </Card>
  )
}