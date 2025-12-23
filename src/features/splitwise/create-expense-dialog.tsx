import z from 'zod'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, DollarSign, Loader2, Receipt, Users } from 'lucide-react'
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { InputGroupAddon } from '@/components/ui/input-group'
import { useMediaQuery } from '@/hooks/use-media-query'

interface CreateExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentUserId: string
  memberIds: string[]
}

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  date: z.date(),
  paidBy: z.string().min(1, 'Payer is required'),
  splitType: z.enum(['equal', 'percentage', 'shares', 'exact']),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  involvedUsers: z
    .array(z.string())
    .min(1, 'At least one person must be involved'),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function CreateExpenseDialog({
  open,
  onOpenChange,
  projectId,
  currentUserId,
  memberIds,
}: CreateExpenseDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [isComplete, setIsComplete] = useState(false)

  // Fetch project members
  const { data: members } = useQuery(
    trpc.project.getMembers.queryOptions({ projectId }),
  )

  const form = useAppForm({
    defaultValues: {
      description: 'Expenses',
      category: 'Grocery',
      amount: 100,
      date: new Date(),
      paidBy: currentUserId,
      splitType: 'equal',
      notes: '',
      receiptUrl: '',
      involvedUsers: memberIds,
    } as ExpenseFormValues,
    validators: {
      onSubmit: expenseSchema,
    },
    onSubmit: async ({ value }) => {
      const splits = value.involvedUsers.map((userId) => ({
        userId,
      }))

      await createExpenseMutation.mutateAsync({
        projectId,
        description: value.description,
        amount: Math.round(value.amount * 100),
        date: value.date,
        paidBy: value.paidBy,
        splitType: value.splitType,
        category: value.category,
        notes: value.notes,
        receiptUrl: value.receiptUrl,
        splits,
      })
    },
  })

  useEffect(() => {
    const paidBy = form.state.values.paidBy
    const involvedUsers = form.state.values.involvedUsers

    if (paidBy && !involvedUsers.includes(paidBy)) {
      form.setFieldValue('involvedUsers', [...involvedUsers, paidBy])
    }
  }, [form.state.values.paidBy])

  const createExpenseMutation = useMutation(
    trpc.splitwise.createExpense.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getExpenses']],
        })
        queryClient.invalidateQueries({
          queryKey: [['splitwise', 'getBalances']],
        })
        setIsComplete(true)
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 2000)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create expense')
      },
    }),
  )

  const resetForm = () => {
    form.reset()
    setIsComplete(false)
  }

  const handleClose = () => {
    if (!createExpenseMutation.isPending && !isComplete) {
      onOpenChange(false)
      setTimeout(resetForm, 300)
    }
  }

  // Form content - shared between Dialog and Drawer
  const formContent = !isComplete ? (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.AppField name="category">
        {(field) => (
          <field.SelectField
            label="Category"
            placeholder="Select category"
            values={[
              { value: 'Grocery', label: 'Grocery' },
              { value: 'Rent', label: 'Rent' },
              { value: 'Utilities', label: 'Utilities' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {(field) => (
          <field.PersonallyTextField
            label="Description"
            placeholder="Enter description"
          />
        )}
      </form.AppField>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <form.AppField name="amount">
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
        <form.AppField name="paidBy">
          {(field) => (
            <field.SelectField
              label="Paid By"
              placeholder="Select payer"
              values={
                members?.map((member) => ({
                  value: member.userId,
                  label: member.user.name || 'Unknown',
                })) ?? []
              }
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="date">
        {(field) => (
          <field.DateField
            label="Date"
            placeholder="Select date"
            className="col-span-2"
          />
        )}
      </form.AppField>

      <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-800 gap-2 py-2 sm:w-full">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={createExpenseMutation.isPending}
        >
          Cancel
        </Button>
        <form.AppForm>
          <form.SubmitButton label="Add Expense" />
        </form.AppForm>
      </div>
    </form>
  ) : (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
      >
        <CheckCircle2 className="size-16 text-green-500 mb-4" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">Expense Added!</h3>
    </motion.div>
  )

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          closeButton={!isComplete}
          onClose={handleClose}
          className="max-w-lg max-h-[95vh]"
        >
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <Receipt className="size-6 text-indigo-500" />
              <DialogTitle>Add Expense</DialogTitle>
            </motion.div>
            <DialogDescription>
              Add a new expense to split with the group.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {formContent}
          </DialogBody>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="w-full max-w-sm">
          <DrawerHeader className="flex text-left float-left">
            <div className="flex items-center gap-2">
              <Receipt className="size-6 text-indigo-500" />
              <DrawerTitle>Add Expense</DrawerTitle>
            </div>
            <DrawerDescription className="ml-8">
              Add a new expense to split with the group.
            </DrawerDescription>
          </DrawerHeader>
        </div>
        <div className="px-4 pb-4 overflow-y-auto max-h-[60vh]">
          {formContent}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
