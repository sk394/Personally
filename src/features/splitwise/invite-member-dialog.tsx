import z from 'zod'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Loader2, Mail, UserPlus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string(),
})

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
}: InviteMemberDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isComplete, setIsComplete] = useState(false)

  const form = useAppForm({
    defaultValues: {
      email: '',
      name: '',
    },
    validators: {
      onSubmit: inviteSchema,
    },
    onSubmit: async ({ value }) => {
      await inviteMutation.mutateAsync({
        projectId,
        invitedEmail: value.email,
        invitedName: value.name,
      })
    },
  })

  const inviteMutation = useMutation(
    trpc.project.inviteUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['project', 'getMembers']],
        })
        setIsComplete(true)
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 2000)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to send invitation')
      },
    }),
  )

  const resetForm = () => {
    form.reset()
    setIsComplete(false)
  }

  const handleClose = () => {
    if (!inviteMutation.isPending && !isComplete) {
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
                <UserPlus className="size-6 text-indigo-500" />
                <DialogTitle>Invite Member</DialogTitle>
              </motion.div>
              <DialogDescription>
                Invite a new member to this project via email.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-4"
              >
                <form.Field
                  name="email"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Email Address</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="friend@example.com"
                      />
                      {field.state.meta.errors ? (
                        <p className="text-sm text-red-500">
                          {field.state.meta.errors.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  )}
                />

                <form.Field
                  name="name"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Name (Optional)</Label>
                      <Input
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                  )}
                />
              </form>
            </DialogBody>

            <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                onClick={form.handleSubmit}
                disabled={form.state.isSubmitting || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="size-4 mr-2" />
                    Send Invite
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
              <h3 className="text-xl font-semibold mb-2">Invitation Sent!</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                An email has been sent to the user.
              </p>
            </motion.div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  )
}
