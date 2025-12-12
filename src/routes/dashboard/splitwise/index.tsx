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

const authStateFn = createServerFn({ method: 'GET' }).handler(async ({}) => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) {
    throw redirect({
      to: '/signin',
    })
  }

  return { userId: session.user?.id }
})

export const Route = createFileRoute('/dashboard/splitwise/')({
  component: RouteComponent,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.project.getByType.queryOptions({ projectType: 'splitwise' }),
    )
    return { userId: context.userId }
  },
})

function RouteComponent() {
  const { userId } = Route.useLoaderData()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: splitwiseProjects, isLoading: isProjectLoading } = useQuery(
    trpc.project.getByType.queryOptions({ projectType: 'splitwise' }),
  )

  // Get the first splitwise project or null if none exists
  const project =
    splitwiseProjects?.owned?.[0] || splitwiseProjects?.member?.[0] || null

  const { data: expenses, isLoading: isExpensesLoading } = useQuery(
    trpc.splitwise.getExpenses.queryOptions(
      { projectId: project?.id! },
      { enabled: !!project },
    ),
  )

  const { data: balances, isLoading: isBalancesLoading } = useQuery(
    trpc.splitwise.getBalances.queryOptions(
      { projectId: project?.id! },
      { enabled: !!project },
    ),
  )

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

  // Calculate total owed to me and total I owe
  const totalOwedToMe =
    balances
      ?.filter((b) => b.toUserId === userId)
      .reduce((acc, curr) => acc + curr.amount, 0) || 0

  const totalIOwe =
    balances
      ?.filter((b) => b.fromUserId === userId)
      .reduce((acc, curr) => acc + curr.amount, 0) || 0

  if (isProjectLoading) return <LoadingBar />

  if (!project) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">
          Splitwise Project Not Found
        </h2>
        <p className="text-muted-foreground">
          Please contact support or create a new project with 'splitwise'
          category.
        </p>
      </div>
    )
  }

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
          Splitwise
        </div>
        <Separator className="bg-border/50" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Splitwise</h1>
          <p className="text-muted-foreground">
            Track shared expenses and settle up.
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

                return (
                  <Card key={balance.id} className="overflow-hidden">
                    <div
                      className={`h-1 w-full ${isIOwe ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                    <CardContent className="p-4 flex items-center justify-between">
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
                        className={`font-bold ${isIOwe ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {formatCurrency(balance.amount, 'USD')}
                      </span>
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
                      {expense.paidBy === userId && (
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
                      )}
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
        projectId={project.id}
        currentUserId={userId}
      />

      <SettlementDialog
        open={settlementDialogOpen}
        onOpenChange={setSettlementDialogOpen}
        projectId={project.id}
        currentUserId={userId}
      />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={project.id}
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
