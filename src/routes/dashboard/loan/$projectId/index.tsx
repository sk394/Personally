import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
    DollarSign,
    Loader2,
    Plus,
    ArrowLeft,
} from 'lucide-react'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Loan } from '@/lib/db/schema'
import PersonallyLogo from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreateNewLoanDialog } from '@/features/loan/create-new-loan-dialog'
import { PaymentDialog } from '@/features/loan/payment-dialog'
import { useTRPC } from '@/integrations/trpc/react'
import { auth } from '@/lib/auth/auth'
import { Link } from '@tanstack/react-router'
import LoanCard from '@/features/loan/loan-card'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/confirm-context'

const authStateFn = createServerFn({ method: 'GET' }).handler(async ({ }) => {
    const session = await auth.api.getSession({ headers: getRequest().headers })
    if (!session) {
        throw redirect({
            to: '/signin',
        })
    }

    return { user: session?.user }
})

export const Route = createFileRoute('/dashboard/loan/$projectId/')({
    component: RouteComponent,
    beforeLoad: async () => await authStateFn(),
    loader: async ({ context, params }) => {
        const { user } = await authStateFn()

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

        return { user, projectId: params.projectId }
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
    const { user, projectId } = Route.useLoaderData()
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const confirm = useConfirm()
    const navigate = useNavigate()

    const [loanDialogOpen, setLoanDialogOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
    const [filter, setFilter] = useState<'all' | 'borrowed' | 'lent'>('all')

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

    // Filter loans based on selection
    const filteredLoans = projectLoans.filter((loan) => {
        if (filter === 'all') return true
        return loan.type === filter
    })

    const deleteLoanMutation = useMutation(
        trpc.loan.delete.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['loan', 'getAll']],
                })
                toast.success('Loan deleted successfully')
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to record payment')
            },
        }),
    )

    const handleDeleteLoan = async (loanId: string) => {
        const confirmed = await confirm({
            title: 'Delete Loan',
            description: 'Are you sure you want to delete this loan? This action cannot be undone.',
            confirmText: deleteLoanMutation.isPending ? "Deleting..." : "Delete",
            cancelText: 'Cancel',
        })
        if (confirmed) {
            deleteLoanMutation.mutate({ id: loanId })
        }
    }

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

            <div className="flex justify-center mb-6">
                <Tabs
                    value={filter}
                    onValueChange={(v) => setFilter(v as 'all' | 'borrowed' | 'lent')}
                >
                    <TabsList>
                        <TabsTrigger value="all">All Loans</TabsTrigger>
                        <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
                        <TabsTrigger value="lent">Lent</TabsTrigger>
                    </TabsList>
                </Tabs>
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
                        {project.description ||
                            "Track money you\\'ve borrowed and lent"}
                    </p>
                </div>
                <Button size="lg" onClick={() => setLoanDialogOpen(true)}>
                    <Plus className="size-5" />
                    Add Loan
                </Button>
            </div>

            {isLoading ? (
                <LoadingBar />
            ) : filteredLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-4">No {filter !== "all" ? filter : ""} loans found.</p>
                    {filter !== 'all' && <Button variant='link' onClick={() => setFilter('all')}>View all loans</Button>}
                    {filter === 'all' && <EmptyLoans onCreateLoan={() => setLoanDialogOpen(true)} />}

                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredLoans.map((loan) => (
                        <LoanCard
                            key={loan.id}
                            loan={loan}
                            onEdit={(id) => console.log('Edit loan:', id)}
                            onDelete={handleDeleteLoan}
                            onAddPayment={(id) => {
                                const loanData = projectLoans.find((l) => l.id === id)
                                if (loanData) {
                                    setSelectedLoan(loanData)
                                    setPaymentDialogOpen(true)
                                }
                            }}
                            onViewDetails={(id) => {
                                navigate({
                                    to: '/dashboard/loan/$projectId/single/$loanId',
                                    params: { projectId, loanId: id },
                                })
                            }}
                        />
                    ))}
                </div>
            )}

            <CreateNewLoanDialog
                open={loanDialogOpen}
                onOpenChange={setLoanDialogOpen}
                projectId={projectId}
            />

            {selectedLoan && (
                <PaymentDialog
                    open={paymentDialogOpen}
                    userName={user?.name}
                    onOpenChange={setPaymentDialogOpen}
                    loanId={selectedLoan.id}
                    contactName={selectedLoan.contactName}
                />
            )}
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