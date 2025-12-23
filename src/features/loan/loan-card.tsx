import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardToolbar } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    MoreHorizontal,
    Edit,
    Trash,
    Receipt,
    FileText,
    CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loan, LoanPayment } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/utils'


// Type definitions based on your schema
export type LoanType = 'borrowed' | 'lent';
export type LoanStatus = 'active' | 'completed' | 'overdue';

interface LoanWithPayments extends Loan {
    payments: LoanPayment[];
}

interface LoanCardProps {
    loan: LoanWithPayments;
    onEdit?: (loanId: string) => void;
    onDelete?: (loanId: string) => void;
    onAddPayment?: (loanId: string) => void;
    onViewDetails?: (loanId: string) => void;
}

export default function LoanCard({ loan, onEdit, onDelete, onAddPayment, onViewDetails }: LoanCardProps) {
    // Calculate payment progress
    const paymentProgress = Math.min((loan.totalPaid / loan.principalAmount) * 100, 100);
    const remainingAmount = Math.max(loan.principalAmount - loan.totalPaid, 0);

    // Calculate accrued interest based on time elapsed
    const calculateAccruedInterest = (): number => {
        if (!loan.hasInterest || !loan.interestRate) return 0;

        // Safety check for loanDate
        if (!loan.loanDate) return 0;

        try {
            // Calculate months elapsed since loan date
            const loanDate = new Date(loan.loanDate);
            const now = new Date();

            // Validate dates
            if (isNaN(loanDate.getTime()) || isNaN(now.getTime())) return 0;

            const monthsElapsed =
                (now.getFullYear() - loanDate.getFullYear()) * 12 +
                (now.getMonth() - loanDate.getMonth()) +
                (now.getDate() - loanDate.getDate()) / 30; // Include partial month

            // Calculate accrued interest: principal * annual rate * (months / 12)
            // Interest accrues on the remaining principal, not the original amount
            const accruedInterest = Math.round(remainingAmount * loan.interestRate * (monthsElapsed / 12));

            return Math.max(accruedInterest, 0); // Ensure non-negative
        } catch (error) {
            console.error('Error calculating accrued interest:', error);
            return 0;
        }
    };

    const accruedInterest = calculateAccruedInterest();
    const totalAmountDue = remainingAmount + accruedInterest;

    // Create the initial loan activity
    const initialActivity = {
        id: 'initial-' + loan.id,
        amount: loan.principalAmount,
        paymentDate: loan.createdAt,
        paymentMethod: loan.type === 'borrowed' ? 'borrowed' : 'lent',
        notes: `Loan created`,
        createdBy: "You",
        isInitial: true,
    };

    // Combine initial activity with payment activities, showing up to 2 payment activities
    const paymentActivities = loan.payments.slice(0, 2).map(p => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        notes: p.notes,
        createdBy: p.createdBy,
        isInitial: false,
    }));

    const loanPaymentActivity = [...paymentActivities, initialActivity].sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    return (
        <Card className="w-full md:w-96 border rounded-xl shadow-sm shadow-blue-500/50">
            <CardHeader className={`h-auto py-4 `}>
                <CardTitle className="flex flex-col gap-1">
                    <span className="uppercase font-bold">{loan.contactName}</span>
                    <span className="text-xs font-normal text-muted-foreground">You {loan.type} {loan.type === "borrowed" ? "from" : "to"} {loan.contactEmail}</span>
                </CardTitle>
                <CardToolbar>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                            <DropdownMenuItem onClick={() => onEdit?.(loan.id)} disabled>
                                <Edit className="h-4 w-4" />
                                Edit Loan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewDetails?.(loan.id)}>
                                <FileText className="h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete?.(loan.id)}
                            >
                                <Trash className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardToolbar>
            </CardHeader>
            <CardContent className="space-y-5 ">
                <div className={`grid ${loan.hasInterest ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Principal Amount</div>
                        <div className={cn("text-xl font-bold", loan.type === 'borrowed' ? 'text-red-500' : 'text-green-500')}>{formatCurrency(loan.principalAmount)}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Remaining</div>
                        <div className="text-xl font-bold">{formatCurrency(remainingAmount)}</div>
                    </div>
                    {loan.hasInterest && (
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground font-medium flex items-center">
                                Interest Accrued
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={cn("text-xl font-bold", loan.type === 'borrowed' ? 'text-red-500' : 'text-green-500')}>
                                    {formatCurrency(accruedInterest)}
                                </div>
                                <span className="text-xs w-3 h-3 mb-3 pl-1 text-muted-foreground/70 hover:text-primary transition-colors">{loan.interestRate}%</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative my-4 flex items-center justify-center overflow-hidden">
                    <Separator />
                    <div className="py-1 px-1 border rounded-full text-center bg-muted text-xs mx-1">
                        <Badge className="flex w-full" variant="outline">
                            {loan.status}
                        </Badge>
                    </div>
                    <Separator />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Payment Progress</span>
                        <span className="text-xs font-semibold">{paymentProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={paymentProgress} className="h-2" />
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(loan.totalPaid)}
                        </span>
                        {loan.hasInterest && (
                            <span className="text-xs text-muted-foreground">
                                Total Due: {formatCurrency(totalAmountDue)}
                            </span>
                        )}
                    </div>
                </div>

                <Separator />
                {/* Recent Activity */}
                <div>
                    <div className="font-medium text-sm text-foreground mb-2.5">Recent Activity</div>
                    <ul className="space-y-2">
                        {loanPaymentActivity.map((a, i) => (
                            <li key={i} className="flex items-center justify-between gap-2.5 text-sm" title={a.notes || undefined}>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className={cn('w-3.5 h-3.5', a.isInitial ? (loan.type === 'borrowed' ? 'text-red-500' : 'text-green-500') : "text-green-500")} />
                                    <span className="text-xs text-foreground truncate">
                                        {a.isInitial
                                            ? `${a.createdBy} ${loan.type} ${loan.contactName} ${formatCurrency(a.amount)}`
                                            : `${a.createdBy} paid ${formatCurrency(a.amount)} via ${a.paymentMethod}`
                                        }
                                    </span>
                                </span>
                                <Badge variant="secondary" appearance="light" size="sm">
                                    {a.paymentDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 h-auto py-3">
                {loan.status !== 'paid' && (
                    <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => onAddPayment?.(loan.id)}
                    >
                        <Receipt className="h-4 w-4 mr-2" />
                        Record Payment
                    </Button>
                )}
            </CardFooter>
        </Card >
    );
}