import z from "zod"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog-old";
import { useState } from "react";
import { motion } from 'motion/react'
import { CheckCircle2, DollarSign, Loader2, Sparkles } from "lucide-react";
import { useAppForm } from "@/hooks/personally.form";
import { loanOpts } from "@/features/shared-form";
import { LoanForm } from "@/features/loan/loan-form";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";
import { toast } from "sonner";

interface CreateNewLoanDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
}

const loanSchema = z.object({
    projectId: z.string().nonempty('Project ID is required'),
    type: z.enum(['borrowed', 'lent']),
    contactName: z
        .string()
        .min(1, 'Contact name is required')
        .max(255, 'Contact name must be at most 255 characters'),
    contactEmail: z.email('Valid contact email is required'),
    principalAmount: z.number()
        .gt(0, 'Principal amount must be greater than 0')
        .positive(),
    currency: z.string().min(1, 'Currency is required'),
    hasInterest: z.boolean(),
    interestRate: z.number()
        .gte(0)
        .positive(),
    loanDate: z.date(),
    dueDate: z.date(),
    notes: z.string(),
    attachments: z
        .array(
            z.object({
                name: z.string(),
                url: z.string().url(),
            })
        )
        .nullable(),
})

export function CreateNewLoanDialog({
    open,
    onOpenChange,
    projectId,
}: CreateNewLoanDialogProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [isComplete, setIsComplete] = useState(false)

    const form = useAppForm({
        ...loanOpts,
        validators: {
            onSubmit: loanSchema,
        },
        onSubmit: async ({ value }) => {
            console.log('Submitting loan with values:', value);
            await createLoanMutation.mutateAsync({
                ...value,
                projectId: projectId!,
                principalAmount: Math.round(value.principalAmount * 100), // convert to cents
            });

        },
    })

    const createLoanMutation = useMutation(
        trpc.loan.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['loans'] })
                setIsComplete(true)
                setTimeout(() => {
                    onOpenChange(false)
                    resetForm()
                }, 2000)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to create loan')
            },
        }),
    )

    const resetForm = () => {
        form.reset()
        setIsComplete(false)
    }

    const handleClose = () => {
        if (!createLoanMutation.isPending && !isComplete) {
            onOpenChange(false)
            setTimeout(resetForm, 300)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                closeButton={!isComplete}
                onClose={handleClose}
                className="max-w-3xl max-h-[90vh] overflow-y-auto"
            >
                {!isComplete ? (
                    <>
                        <DialogHeader>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Sparkles className="size-6 text-indigo-500" />
                                <DialogTitle>Create New Loan</DialogTitle>
                            </motion.div>
                            <DialogDescription>
                                Track money you've borrowed or lent. Fill in the details below.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogBody className="space-y-6">
                            <LoanForm form={form} />
                        </DialogBody>

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
                                onClick={(e) => {
                                    e.preventDefault()
                                    // e.stopPropagation()
                                    form.handleSubmit()
                                }}
                                disabled={form.state.isSubmitting || createLoanMutation.isPending}
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
        </Dialog>
    )
}