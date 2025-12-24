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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMediaQuery } from '@/hooks/use-media-query'

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
  const isDesktop = useMediaQuery('(min-width: 768px)')
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

  // Form content - shared between Dialog and Drawer
  const formContent = !isComplete ? (
    <form
      onSubmit={(e) => {
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.AppField name="email">
        {(field) => (
          <field.EmailField
            label="Email"
            placeholder="bipendra@example.com"
          />
        )}
      </form.AppField>

      <form.AppField name="name">
        {(field) => (
          <field.PersonallyTextField
            label="Name"
            placeholder="Bipendra Basnet"
          />
        )}
      </form.AppField>
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
      <h3 className="text-xl font-semibold mb-2">Invitation Sent!</h3>
      <p className="text-zinc-600 dark:text-zinc-400">
        A notification has been sent to the user.
      </p>
    </motion.div>
  )

  // Footer buttons - shared between Dialog and Drawer
  const footerButtons = !isComplete && (
    <div className="flex gap-2">

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
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={inviteMutation.isPending}
      >
        Cancel
      </Button>
    </div>
  )

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          closeButton={!isComplete}
          onClose={handleClose}
          className="max-w-md"
        >
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
            {formContent}
          </DialogBody>

          <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            {footerButtons}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="top">
      <DrawerContent className="z-1000 p-4" >
        <DrawerHeader className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <UserPlus className="size-6 text-indigo-500" />
            <DrawerTitle>Invite Member</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex-1 px-4 space-y-4">
          {formContent}
          {footerButtons}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
