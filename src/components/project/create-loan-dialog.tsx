import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    // DialogBody,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2,
    DollarSign,
    Calendar,
    User,
    CheckCircle2,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Mail
} from "lucide-react"
import { useTRPC } from "@/integrations/trpc/react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"

interface CreateLoanDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId?: string // Optional: if provided, use this project ID instead of fetching
}

export function CreateLoanDialog({ open, onOpenChange, projectId }: CreateLoanDialogProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const [formData, setFormData] = React.useState({
        type: "borrowed" as "borrowed" | "lent",
        contactName: "",
        contactEmail: "",
        principalAmount: "",
        currency: "USD",
        hasInterest: false,
        interestRate: "",
        loanDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        notes: "",
    })
    const [isComplete, setIsComplete] = React.useState(false)

    // Track which fields should be visible
    const [visibleFields, setVisibleFields] = React.useState({
        type: true,
        contactName: false,
        amount: false,
        dates: false,
        interest: false,
        notes: false,
    })


    // Create loan mutation
    const createLoanMutation = useMutation(
        trpc.loan.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["loan"] })
                setIsComplete(true)
                setTimeout(() => {
                    onOpenChange(false)
                    resetForm()
                    navigate({ to: "/dashboard/loans" })
                }, 1500)
            },
            onError: (error: any) => {
                toast.error(error.message || "Failed to create loan")
            },
        })
    )

    const resetForm = () => {
        setFormData({
            type: "borrowed",
            contactName: "",
            contactEmail: "",
            principalAmount: "",
            currency: "USD",
            hasInterest: false,
            interestRate: "",
            loanDate: new Date().toISOString().split('T')[0],
            dueDate: "",
            notes: "",
        })
        setIsComplete(false)
        setVisibleFields({
            type: true,
            contactName: false,
            amount: false,
            dates: false,
            interest: false,
            notes: false,
        })
    }

    const handleClose = () => {
        if (!createLoanMutation.isPending && !isComplete) {
            onOpenChange(false)
            setTimeout(resetForm, 300)
        }
    }

    // Auto-reveal fields based on user input
    React.useEffect(() => {
        if (formData.type && !visibleFields.contactName) {
            setTimeout(() => {
                setVisibleFields(prev => ({ ...prev, contactName: true }))
            }, 200)
        }
    }, [formData.type, visibleFields.contactName])

    React.useEffect(() => {
        if (formData.contactName.trim().length > 0 && !visibleFields.amount) {
            setTimeout(() => {
                setVisibleFields(prev => ({ ...prev, amount: true }))
            }, 200)
        }
    }, [formData.contactName, visibleFields.amount])

    React.useEffect(() => {
        if (formData.principalAmount && !visibleFields.dates) {
            setTimeout(() => {
                setVisibleFields(prev => ({ ...prev, dates: true }))
            }, 200)
        }
    }, [formData.principalAmount, visibleFields.dates])

    React.useEffect(() => {
        if (formData.loanDate && !visibleFields.interest) {
            setTimeout(() => {
                setVisibleFields(prev => ({ ...prev, interest: true }))
            }, 200)
        }
    }, [formData.loanDate, visibleFields.interest])

    React.useEffect(() => {
        if ((formData.hasInterest || !formData.hasInterest) && visibleFields.interest && !visibleFields.notes) {
            setTimeout(() => {
                setVisibleFields(prev => ({ ...prev, notes: true }))
            }, 200)
        }
    }, [formData.hasInterest, visibleFields.interest, visibleFields.notes])

    const handleSubmit = async () => {


        if (!formData.contactName.trim()) {
            toast.error("Please enter contact name")
            return
        }

        if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        if (!formData.loanDate) {
            toast.error("Please select a loan date")
            return
        }

        // Convert amount to cents
        const amountInCents = Math.round(parseFloat(formData.principalAmount) * 100)

        createLoanMutation.mutate({
            projectId: projectId!,
            type: formData.type,
            contactName: formData.contactName,
            contactEmail: formData.contactEmail || undefined,
            principalAmount: amountInCents,
            currency: formData.currency,
            hasInterest: formData.hasInterest,
            interestRate: formData.hasInterest && formData.interestRate
                ? parseFloat(formData.interestRate) / 100
                : null,
            loanDate: new Date(formData.loanDate),
            dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
            notes: formData.notes || null,
            status: "active",
            totalPaid: 0,
        })
    }

    const canSubmit = formData.contactName.trim().length > 0 &&
        formData.principalAmount &&
        parseFloat(formData.principalAmount) > 0 &&
        formData.loanDate !== ""

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                // closeButton={!isComplete}
                // onClose={handleClose}
                className="max-w-2xl max-h-[85vh] overflow-y-auto"
            >
                {!isComplete ? (
                    <>
                        <DialogHeader>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2"
                            >
                                <DollarSign className="size-6 text-green-500" />
                                <DialogTitle>Create New Loan</DialogTitle>
                            </motion.div>
                            <DialogDescription>
                                Track money you've borrowed or lent. Fill in the details below.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Loan Type - Always visible */}
                            <motion.div
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                className="space-y-3"
                            >
                                <Label className="text-base font-semibold">Loan Type *</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: "borrowed" }))}
                                        className={cn(
                                            "p-4 rounded-lg border-2 transition-all text-left",
                                            formData.type === "borrowed"
                                                ? "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-sm"
                                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <TrendingDown className={cn(
                                                "size-5 mt-0.5",
                                                formData.type === "borrowed"
                                                    ? "text-red-600 dark:text-red-400"
                                                    : "text-zinc-600 dark:text-zinc-400"
                                            )} />
                                            <div className="flex-1">
                                                <div className="font-medium">Borrowed</div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    Money you owe to someone
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: "lent" }))}
                                        className={cn(
                                            "p-4 rounded-lg border-2 transition-all text-left",
                                            formData.type === "lent"
                                                ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-sm"
                                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <TrendingUp className={cn(
                                                "size-5 mt-0.5",
                                                formData.type === "lent"
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-zinc-600 dark:text-zinc-400"
                                            )} />
                                            <div className="flex-1">
                                                <div className="font-medium">Lent</div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    Money someone owes you
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>

                            {/* Contact Name Field */}
                            <AnimatePresence>
                                {visibleFields.contactName && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -20 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <ChevronDown className="size-4 text-green-500" />
                                            <Label htmlFor="contactName" className="text-base font-semibold">
                                                Contact Name *
                                            </Label>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 size-4 text-zinc-400" />
                                                <Input
                                                    id="contactName"
                                                    placeholder={formData.type === "borrowed" ? "Who did you borrow from?" : "Who did you lend to?"}
                                                    value={formData.contactName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 size-4 text-zinc-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="Email (optional)"
                                                    value={formData.contactEmail}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Amount Field */}
                            <AnimatePresence>
                                {visibleFields.amount && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -20 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <ChevronDown className="size-4 text-green-500" />
                                            <Label htmlFor="amount" className="text-base font-semibold">
                                                Loan Amount *
                                            </Label>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <DollarSign className="absolute left-3 top-3 size-4 text-zinc-400" />
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={formData.principalAmount}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, principalAmount: e.target.value }))}
                                                    className="pl-10"
                                                />
                                            </div>
                                            <Input
                                                value={formData.currency}
                                                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                                                maxLength={3}
                                                className="w-20 text-center"
                                                placeholder="USD"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Date Fields */}
                            <AnimatePresence>
                                {visibleFields.dates && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -20 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <ChevronDown className="size-4 text-green-500" />
                                            <Label className="text-base font-semibold">Dates</Label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="loanDate" className="text-sm">Loan Date *</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-3 size-4 text-zinc-400" />
                                                    <Input
                                                        id="loanDate"
                                                        type="date"
                                                        value={formData.loanDate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, loanDate: e.target.value }))}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="dueDate" className="text-sm">Due Date (Optional)</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-3 size-4 text-zinc-400" />
                                                    <Input
                                                        id="dueDate"
                                                        type="date"
                                                        value={formData.dueDate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Interest Field */}
                            <AnimatePresence>
                                {visibleFields.interest && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -20 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <ChevronDown className="size-4 text-green-500" />
                                            <Label className="text-base font-semibold">Interest (Optional)</Label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="hasInterest"
                                                checked={formData.hasInterest}
                                                onChange={(e) => setFormData(prev => ({ ...prev, hasInterest: e.target.checked }))}
                                                className="size-4 rounded"
                                            />
                                            <Label htmlFor="hasInterest" className="cursor-pointer">
                                                This loan has interest
                                            </Label>
                                        </div>
                                        {formData.hasInterest && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="relative"
                                            >
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    placeholder="Interest rate"
                                                    value={formData.interestRate}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                                                    className="pr-10"
                                                />
                                                <span className="absolute right-3 top-3 text-sm text-zinc-500">%</span>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Notes Field */}
                            <AnimatePresence>
                                {visibleFields.notes && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -20 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <ChevronDown className="size-4 text-green-500" />
                                            <Label htmlFor="notes" className="text-base font-semibold">
                                                Notes (Optional)
                                            </Label>
                                        </div>
                                        <Textarea
                                            id="notes"
                                            placeholder="Add any additional notes about this loan..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={3}
                                            className="resize-none"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={createLoanMutation.isPending}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit || createLoanMutation.isPending}
                            >
                                {createLoanMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="size-4" />
                                        Create Loan
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <DialogBody className="py-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                            >
                                <CheckCircle2 className="size-16 text-green-500 mb-4" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">Loan Created!</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Redirecting to loans dashboard...
                            </p>
                        </motion.div>
                    </DialogBody>
                )}
            </DialogContent>
        </Dialog >
    )
}
