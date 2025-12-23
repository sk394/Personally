import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
  ArrowLeft,
  Loader2,
  Receipt,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTRPC } from '@/integrations/trpc/react'
import { auth } from '@/lib/auth/auth'
import { cn, formatCurrency, formatDate, formatProperName } from '@/lib/utils'
import PaymentChart from '@/features/loan/payment-chart'
import { useMediaQuery } from '@/hooks/use-media-query'

const authStateFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) {
    throw redirect({
      to: '/signin',
    })
  }

  return { user: session?.user }
})

export const Route = createFileRoute('/dashboard/loan/$projectId/single/$loanId')({
  component: RouteComponent,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context, params }) => {
    const { user } = await authStateFn()

    // Prefetch loan data
    await context.queryClient.prefetchQuery(
      context.trpc.loan.getById.queryOptions({
        id: params.loanId,
      }),
    )

    // Prefetch project data
    await context.queryClient.prefetchQuery(
      context.trpc.project.getById.queryOptions({
        id: params.projectId,
        expectedType: 'loan',
      }),
    )

    return { user, projectId: params.projectId, loanId: params.loanId }
  },
  errorComponent: ({ error }) => {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'You do not have access to this loan.'}
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
  const { projectId, loanId } = Route.useLoaderData()
  const trpc = useTRPC()
  const navigate = useNavigate()

  // Query loan data
  const { data: loanData, isLoading: isLoanLoading } = useQuery(
    trpc.loan.getById.queryOptions({
      id: loanId,
    }),
  )

  // Query project data
  const { data: project, isLoading: isProjectLoading } = useQuery(
    trpc.project.getById.queryOptions({
      id: projectId,
      expectedType: 'loan',
    }),
  )

  if (isLoanLoading || isProjectLoading) {
    return <LoadingBar />
  }

  if (!loanData || !project) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Loan Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The loan you're looking for doesn't exist.
        </p>
        <Button
          onClick={() =>
            navigate({
              to: '/dashboard/loan/$projectId',
              params: { projectId },
            })
          }
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Loans
        </Button>
      </div>
    )
  }

  // Sort payments by date (most recent first)
  const sortedPayments = [...loanData.payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
  )

  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <button
          onClick={() =>
            navigate({
              to: '/dashboard/loan/$projectId',
              params: { projectId },
            })
          }
          className="hover:text-foreground"
        >
          {project.title}
        </button>
        <span>/</span>
        <span className="text-foreground">{loanData.contactName}</span>
      </div>

      {/* Header Section - Minimal */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          {loanData.contactName}
        </h1>
        <Badge
          variant='outline'
          className={cn(
            loanData.type === 'lent' && 'bg-green-500 hover:bg-green-600',
          )}
        >
          {loanData.type === 'borrowed' ? 'Borrowed' : 'Lent'}
        </Badge>
        {loanData.status === 'paid' && (
          <Badge variant="secondary">Paid</Badge>
        )}
      </div>
      <div className={cn("flex gap-6", isMobile ? "flex-col" : "grid grid-cols-1 lg:grid-cols-12 gap-6")}>
        <div className="lg:col-span-9">
          <PaymentChart
            payments={loanData.payments}
            principalAmount={loanData.principalAmount}
            loanDate={loanData.loanDate}
            type={loanData.type}
            hasInterest={loanData.hasInterest}
            interestRate={loanData.interestRate}
          />
        </div>
        <div className="lg:col-span-3">
          <Card className="h-fit sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Started</span>
                <span className="font-medium">{formatDate(loanData.loanDate)}</span>
              </div>

              {loanData.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due</span>
                  <span className="font-medium">{formatDate(loanData.dueDate)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{loanData.currency}</span>
              </div>

              {loanData.contactEmail && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-xs block mb-1">Contact</span>
                  <span className="text-xs break-all">{loanData.contactEmail}</span>
                </div>
              )}

              {loanData.notes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-xs block mb-1">Notes</span>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{loanData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3 items-center justify-between">
          <CardTitle className="text-lg font-medium">Payment History</CardTitle>
          <span className="text-sm text-muted-foreground">
            {sortedPayments.length} payment{sortedPayments.length !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent>
          {sortedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="size-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">
                No payments recorded yet
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Method</TableHead>
                    <TableHead className="hidden lg:table-cell">Paid By</TableHead>
                    <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatProperName(payment.createdBy)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate text-muted-foreground">
                        {payment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LoadingBar() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}
