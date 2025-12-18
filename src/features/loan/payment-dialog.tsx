import z from 'zod'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, DollarSign, Loader2, Receipt, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useAppForm } from '@/hooks/personally.form'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/integrations/trpc/react'
import { paymentMethodEnum } from '@/lib/db/enums'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { PaymentForm } from '@/features/loan/payment-form'

interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    loanId: string
    contactName: string
    userName: string
}

const paymentSchema = z.object({
    loanId: z.string().uuid(),
    amount: z.number().positive('Amount must be positive'),
    paymentDate: z.date(),
    paymentMethod: z.enum(paymentMethodEnum.enumValues),
    createdBy: z.string(),
    notes: z.string().optional(),
})

export function PaymentDialog({
    open,
    onOpenChange,
    loanId,
    contactName,
    userName,
}: PaymentDialogProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [isComplete, setIsComplete] = useState(false)

    const form = useAppForm({
        defaultValues: {
            loanId,
            amount: 10,
            paymentDate: new Date(),
            paymentMethod: 'zelle',
            createdBy: '',
            notes: '',
        } as z.infer<typeof paymentSchema>,
        validators: {
            onSubmit: paymentSchema,
        },
        onSubmit: async ({ value }) => {
            console.log('Submitting payment:', value)
            await addPaymentMutation.mutateAsync({
                ...value,
                amount: Math.round(value.amount * 100), // convert to cents
                principalPaid: Math.round(value.amount * 100),
                interestPaid: 0,
            })

        },
    })

    const addPaymentMutation = useMutation(
        trpc.loan.addPayment.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['loan', 'getAll']],
                })
                queryClient.invalidateQueries({
                    queryKey: [['loan', 'getById'], { id: loanId }],
                })
                setIsComplete(true)
                setTimeout(() => {
                    onOpenChange(false)
                    resetForm()
                }, 2000)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to record payment')
            },
        }),
    )

    const resetForm = () => {
        form.reset()
        setIsComplete(false)
    }

    const handleClose = () => {
        if (!addPaymentMutation.isPending && !isComplete) {
            onOpenChange(false)
            setTimeout(resetForm, 300)
        }
    }

    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>  <div className="flex items-center gap-2">
                            <Receipt className="size-6 text-green-500" />
                            <DrawerTitle>Record Payment for {contactName}</DrawerTitle>
                        </div>
                        </DialogTitle>

                    </DialogHeader>
                    {!isComplete ? (
                        <>
                            <PaymentForm form={form} userName={userName} contactName={contactName} />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={addPaymentMutation.isPending}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        form.handleSubmit()
                                    }}
                                    disabled={
                                        form.state.isSubmitting || addPaymentMutation.isPending
                                    }
                                >
                                    {addPaymentMutation.isPending ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Recording...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="size-4" />
                                            Record Payment
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>)
                        :
                        (
                            <div className="py-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center text-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                                    >
                                        <CheckCircle2 className="size-16 text-green-500 mb-4" />
                                    </motion.div>
                                    <h3 className="text-xl font-semibold mb-2">Payment Recorded!</h3>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        The loan balance has been updated.
                                    </p>
                                </motion.div>
                            </div>
                        )}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                {!isComplete ? (
                    <>
                        <DrawerHeader className="text-left">
                            <div className="flex items-center gap-2">
                                <Receipt className="size-6 text-green-500" />
                                <DrawerTitle>Record Payment for {contactName}</DrawerTitle>
                            </div>
                        </DrawerHeader>
                        <PaymentForm form={form} userName={userName} contactName={contactName} />
                        <DrawerFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={addPaymentMutation.isPending}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    form.handleSubmit()
                                }}
                                disabled={
                                    form.state.isSubmitting || addPaymentMutation.isPending
                                }
                            >
                                {addPaymentMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        Record Payment
                                    </>
                                )}
                            </Button>
                        </DrawerFooter>
                    </>
                ) : (
                    <div className="py-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                            >
                                <CheckCircle2 className="size-16 text-green-500 mb-4" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">Payment Recorded!</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                The loan balance has been updated.
                            </p>
                        </motion.div>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    )
}
