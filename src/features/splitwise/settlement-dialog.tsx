import z from 'zod'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, DollarSign, Handshake, Loader2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAppForm } from '@/hooks/personally.form'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/integrations/trpc/react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog-old'
import { InputGroupAddon } from '@/components/ui/input-group'

interface SettlementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  amount: number
  currentUserId: string
}

const settlementSchema = z.object({
  payerId: z.string().min(1, 'Payer is required'),
  receiverId: z.string().min(1, 'Receiver is required'),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['zelle', 'cash']),
  date: z.date(),
})

export function SettlementDialog({
  open,
  onOpenChange,
  projectId,
  amount,
  currentUserId,
}: SettlementDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isComplete, setIsComplete] = useState(false)

  const { data: members } = useQuery(
    trpc.project.getMembers.queryOptions({ projectId }),
  )

  const form = useAppForm({
    defaultValues: {
      payerId: currentUserId,
      receiverId: '',
      amount: amount / 100,
      paymentMethod: 'zelle',
      date: new Date(),
    },
    validators: {
      onSubmit: settlementSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.payerId === value.receiverId) {
        toast.error('Payer and receiver cannot be the same person')
        return
      }

      await settleUpMutation.mutateAsync({
        projectId,
        fromUserId: value.payerId,
        toUserId: value.receiverId,
        amount: Math.round(value.amount * 100), // cents
        paymentMethod: value.paymentMethod as 'zelle' | 'cash',
        date: value.date,
      })
    },
  })

  const settleUpMutation = useMutation(
    trpc.splitwise.settleUp.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getBalances']],
        })
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getExpenses']],
        })
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getSettlements']],
        })
        setIsComplete(true)
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 2000)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to record settlement')
      },
    }),
  )

  const resetForm = () => {
    form.reset()
    setIsComplete(false)
  }

  const handleClose = () => {
    if (!settleUpMutation.isPending && !isComplete) {
      onOpenChange(false)
      setTimeout(resetForm, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeButton={!isComplete}
        onClose={handleClose}
        className="max-w-md"
      >
        {!isComplete ? (
          <>
            <DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <Handshake className="size-6 text-green-500" />
                <DialogTitle>Settle Up</DialogTitle>
              </motion.div>
              <DialogDescription>
                Record a payment between group members.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                  <form.AppField
                    name="payerId"
                  >
                    {(field) => (
                      <>
                        <field.SelectField
                          label="Who is paying?"
                          placeholder="Select payer"
                          values={[
                            { value: currentUserId, label: 'You' },
                            ...(members?.filter((m) => m.userId !== currentUserId).map((member) => ({
                              value: member?.userId,
                              label: member?.user.name || member.user.email || 'Unknown',
                            })) ?? []),
                          ]}
                        />
                      </>
                    )}
                  </form.AppField>
                  <form.AppField
                    name="receiverId"
                  >
                    {(field) => (
                      <>
                        <field.SelectField
                          label="Who is receiving?"
                          placeholder="Select receiver"
                          values={[
                            { value: currentUserId, label: 'You' },
                            ...(members?.filter((m) => m.userId !== currentUserId).map((member) => ({
                              value: member?.userId,
                              label: member?.user.name || member.user.email || 'Unknown',
                            })) ?? []),
                          ]}
                        />
                      </>
                    )}
                  </form.AppField>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:grid-cols-1">
                  <form.AppField
                    name="amount"
                  >
                    {(field) => (

                      <field.NumberField
                        label="Amount"
                        placeholder="Enter amount"
                        required
                        children={
                          <InputGroupAddon>
                            <DollarSign className="size-4" />
                          </InputGroupAddon>
                        }
                      />

                    )}
                  </form.AppField>

                  <form.AppField
                    name="paymentMethod"
                  >
                    {(field) => (
                      <>
                        <field.SelectField
                          label="Payment Method"
                          placeholder="Select payment method"
                          values={[
                            { value: 'zelle', label: 'Zelle' },
                            { value: 'cash', label: 'Cash' },
                          ]}
                        />
                      </>
                    )}
                  </form.AppField>
                </div>
                <form.AppField
                  name="date"
                >
                  {(field) => (
                    <field.DateField
                      label="Date"
                      placeholder="Select date"
                      className="col-span-2"
                    />
                  )}
                </form.AppField>
              </form>
            </DialogBody>

            <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={settleUpMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                onClick={form.handleSubmit}
                disabled={form.state.isSubmitting || settleUpMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {settleUpMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" />
                    Record Payment
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
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              >
                <CheckCircle2 className="size-16 text-green-500 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">
                Settlement Recorded!
              </h3>
            </motion.div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  )
}
