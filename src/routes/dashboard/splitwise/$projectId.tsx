import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Handshake,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Users,
  ArrowLeft,
  CheckCircle2,
  Clock,
  BadgeCheckIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import PersonallyLogo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useTRPC } from '@/integrations/trpc/react'
import { auth } from '@/lib/auth/auth'
import { formatCurrency } from '@/lib/utils'
import { CreateExpenseDialog } from '@/features/splitwise/create-expense-dialog'
import { SettlementDialog } from '@/features/splitwise/settlement-dialog'
import { InviteMemberDialog } from '@/features/splitwise/invite-member-dialog'
import { SettingsDialog } from '@/features/splitwise/settings-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'

const authStateFn = createServerFn({ method: 'GET' }).handler(async ({ }) => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) {
    throw redirect({
      to: '/signin',
    })
  }

  return { userId: session.user?.id }
})

export const Route = createFileRoute('/dashboard/splitwise/$projectId')({
  component: RouteComponent,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context, params }) => {
    const { userId } = await authStateFn()

    // Prefetch project data to validate access and type
    await context.queryClient.prefetchQuery(
      context.trpc.project.getById.queryOptions({
        id: params.projectId,
        expectedType: 'splitwise',
      }),
    )

    // Prefetch splitwise data for this specific project
    await context.queryClient.prefetchQuery(
      context.trpc.splitwise.getExpenses.queryOptions({ projectId: params.projectId }),
    )

    await context.queryClient.prefetchQuery(
      context.trpc.splitwise.getBalances.queryOptions({ projectId: params.projectId }),
    )

    await context.queryClient.prefetchQuery(
      context.trpc.splitwise.getSettings.queryOptions({ projectId: params.projectId }),
    )

    await context.queryClient.prefetchQuery(
      context.trpc.splitwise.getSettlements.queryOptions({ projectId: params.projectId }),
    )

    return { userId, projectId: params.projectId }
  },
  errorComponent: ({ error }) => {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'You do not have access to this splitwise project.'}
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
  const queryClient = useQueryClient()
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAllSettlements, setShowAllSettlements] = useState(false)


  // Query project data with access control
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery(
    trpc.project.getById.queryOptions({
      id: projectId,
      expectedType: 'splitwise',
    }),
  )

  const { data: expenses, isLoading: isExpensesLoading } = useQuery(
    trpc.splitwise.getExpenses.queryOptions({ projectId }),
  )

  const { data: balances, isLoading: isBalancesLoading } = useQuery(
    trpc.splitwise.getBalances.queryOptions({ projectId }),
  )

  const { data: settings } = useQuery(
    trpc.splitwise.getSettings.queryOptions({ projectId }),
  )

  const { data: settlements } = useQuery(
    trpc.splitwise.getSettlements.queryOptions({ projectId }),
  )

  // Handle project access errors
  if (projectError) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You do not have access to this splitwise project.
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
          The splitwise project you're looking for doesn't exist.
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

  const deleteExpenseMutation = useMutation(
    trpc.splitwise.deleteExpense.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getExpenses']],
        })
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getBalances']],
        })
        toast.success('Expense deleted')
        setDeletingId(null)
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete expense')
        setDeletingId(null)
      },
    }),
  )

  // Calculate total owed to me and total I owe (including interest)
  const totalOwedToMe =
    balances
      ?.filter((b) => b.toUserId === userId)
      .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0) || 0

  const totalIOwe =
    balances
      ?.filter((b) => b.fromUserId === userId)
      .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0) || 0

  // Calculate total interest earned and paid
  const totalInterestEarned =
    balances
      ?.filter((b) => b.toUserId === userId)
      .reduce((acc, curr) => acc + (curr.accruedInterest || 0), 0) || 0

  const totalInterestPaying =
    balances
      ?.filter((b) => b.fromUserId === userId)
      .reduce((acc, curr) => acc + (curr.accruedInterest || 0), 0) || 0

  if (!settlements || settlements.length === 0) return null
  const hasMoreThanFive = settlements.length > 3
  const visibleSettlements = showAllSettlements ? settlements : settlements.slice(0, 3)

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex-1 flex items-center justify-center px-4 py-2 sm:py-6">
        <div className="w-full max-w-2xl items-center justify-center flex">
          <PersonallyLogo width="350" height="40" />
        </div>
      </div>

      <div className="relative my-4 flex items-center justify-center overflow-hidden">
        <Separator className="bg-border/50" />
        <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
          Splitwise Project
        </div>
        <Separator className="bg-border/50" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-1">{project.title}</h1>
          <p className="text-muted-foreground">
            {project.description || 'Track shared expenses and settle up.'}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="size-4" />
          </Button>

          <SettingsDialog
            projectId={projectId}
            initialSettings={{
              ...settings,
              interestRate: settings?.interestRate ?? undefined,
              interestStartMonths: settings?.interestStartMonths ?? undefined,
            }}
          />

          <Button
            variant="outline"
            onClick={() => setSettlementDialogOpen(true)}
          >
            <Handshake className="size-4 mr-2" />
            Settle Up
          </Button>
          <Button onClick={() => setExpenseDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                You are owed
              </p>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totalOwedToMe, 'USD')}
              </h3>
            </div>
            <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
              <ArrowUpRight className="size-6 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                You owe
              </p>
              <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totalIOwe, 'USD')}
              </h3>
            </div>
            <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full">
              <ArrowDownLeft className="size-6 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balances Column */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="size-5" />
            Balances
          </h2>

          {/* Interest Summary - Only show if there's any interest */}
          {(totalInterestEarned > 0 || totalInterestPaying > 0) && (
            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  Interest Summary
                </p>
                {totalInterestEarned > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Earned:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{formatCurrency(totalInterestEarned, 'USD')}
                    </span>
                  </div>
                )}
                {totalInterestPaying > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Paying:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(totalInterestPaying, 'USD')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settlements */}
          {settlements && settlements.length > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Recent Settlements
                  </p>
                  {hasMoreThanFive && (
                    <button
                      type="button"
                      onClick={() => setShowAllSettlements((v) => !v)}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {showAllSettlements ? "Show less" : `View all (${settlements.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {visibleSettlements.map((settlement) => {
                    const isPayer = settlement.fromUserId === userId
                    const otherUser = isPayer
                      ? settlement.receiver
                      : settlement.payer
                    const isVerified = settlement.status === 'verified'

                    return (
                      <div
                        key={settlement.id}
                        className="flex items-center justify-between text-sm p-2"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isVerified ? (
                            <BadgeCheckIcon className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          ) : (
                            <Clock className="size-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                          )}
                          <span className="text-muted-foreground">
                            {isPayer ? 'You' : otherUser?.name?.trim().split(/\s+/)[0] || otherUser?.email || 'User'} {settlement.paymentMethod === 'cash' ? 'paid' : 'zelle'}{' '}{isPayer ? otherUser?.name?.trim().split(/\s+/)[0] : 'You'} {" "}
                            <span className="font-semibold  text-green-600">
                              {formatCurrency(settlement.amount, 'USD')}
                            </span>
                            {' '}on{' '}
                            {new Date(settlement.settlementDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>

                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {isBalancesLoading ? (
            <LoadingBar />
          ) : balances?.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No outstanding balances.
            </p>
          ) : (
            <div className="space-y-3">
              {balances?.map((balance) => {
                const isIOwe = balance.fromUserId === userId
                const otherUser = isIOwe ? balance.creditor : balance.debtor
                const totalAmount = balance.totalAmount || balance.amount
                const hasInterest = balance.accruedInterest && balance.accruedInterest > 0

                return (
                  <Card key={balance.id} className="overflow-hidden">
                    <div
                      className={`h-1 w-full ${isIOwe ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback>
                              {otherUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {otherUser?.name || otherUser?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isIOwe ? 'you owe' : 'owes you'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-bold text-lg ${isIOwe ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(totalAmount, 'USD')}
                        </span>
                      </div>
                      {hasInterest && (
                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Principal:</span>
                            <span>{formatCurrency(balance.baseAmount, 'USD')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accrued Interest:</span>
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(balance.accruedInterest, 'USD')}
                            </span>
                          </div>
                          {balance.interestRate && (
                            <div className="flex justify-between">
                              <span>Rate:</span>
                              <span>{(balance.interestRate * 100).toFixed(2)}% p.a.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Expenses Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="size-5" />
            Recent Activity
          </h2>
          {isExpensesLoading ? (
            <LoadingBar />
          ) : expenses?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="size-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add an expense to start tracking.
                </p>
                <Button onClick={() => setExpenseDialogOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expenses?.map((expense) => (
                <Card
                  key={expense.id}
                  className="hover:shadow-md transition-shadow group relative"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted p-3 rounded-lg text-center min-w-[60px]">
                        <div className="text-xs text-muted-foreground uppercase">
                          {new Date(expense.expenseDate).toLocaleString(
                            'default',
                            { month: 'short' },
                          )}
                        </div>
                        <div className="text-xl font-bold">
                          {new Date(expense.expenseDate).getDate()}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {expense.description}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {expense.paidBy === userId
                            ? 'You'
                            : expense.payer?.name || 'Someone'}{' '}
                          paid {formatCurrency(expense.amount, 'USD')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {expense.paidBy === userId ? (
                          <div className="text-green-600 font-medium">
                            <span className="text-xs text-muted-foreground block">
                              you lent
                            </span>
                            {(() => {
                              const mySplit = expense.splits.find(
                                (s) => s.userId === userId,
                              )
                              const lent =
                                expense.amount - (mySplit?.amount || 0)
                              return formatCurrency(lent, 'USD')
                            })()}
                          </div>
                        ) : (
                          <div className="text-red-600 font-medium">
                            <span className="text-xs text-muted-foreground block">
                              you borrowed
                            </span>
                            {(() => {
                              const mySplit = expense.splits.find(
                                (s) => s.userId === userId,
                              )
                              return formatCurrency(mySplit?.amount || 0, 'USD')
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Delete Button (Only visible if I paid or am owner - simplified to if I paid for now) */}
                      {/* {expense.paidBy === userId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Expense?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the expense and reverse all
                                balance updates. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteExpenseMutation.mutate({
                                    expenseId: expense.id,
                                  })
                                }
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {deleteExpenseMutation.isPending &&
                                  deletingId === expense.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  'Delete'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )} */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        projectId={projectId}
        currentUserId={userId}
      />

      <SettlementDialog
        open={settlementDialogOpen}
        onOpenChange={setSettlementDialogOpen}
        projectId={projectId}
        amount={totalIOwe}
        currentUserId={userId}
      />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={projectId}
      />
    </div>
  )
}

function LoadingBar() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}