import z from 'zod'
import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog-old'
import { useAppForm } from '@/hooks/personally.form'
import { projectOpts } from '@/features/shared-form'
import { ProjectForm } from '@/features/project/project-form'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/integrations/trpc/react'

interface CreateNewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const projectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string().nullable(),
  projectType: z.enum(['loan', 'splitwise', 'general']),
  visibility: z.enum(['private', 'shared', 'public']),
  maxMembers: z
    .number()
    .int()
    .min(1, 'Must have at least 1 member')
    .max(50, 'Max members exceeded'),
  invitations: z.array(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string(),
    }),
  ),
  currentInviteEmail: z.string(),
  currentInviteName: z.string(),
})

export function CreateNewProjectDialog({
  open,
  onOpenChange,
}: CreateNewProjectDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [isComplete, setIsComplete] = useState(false)

  const form = useAppForm({
    ...projectOpts,
    validators: {
      onChange: projectSchema,
    },
    onSubmit: async ({ value }) => {
      await createProjectMutation.mutateAsync({
        title: value.title,
        description: value.description || undefined,
        projectType: value.projectType,
        visibility: value.visibility,
        maxMembers: value.maxMembers,
        invitations: value.invitations.map((inv) => ({
          email: inv.email,
          name: inv.name || '',
        })),
      })
    },
  })

  const createProjectMutation = useMutation(
    trpc.project.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project'] })
        setIsComplete(true)
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 2000)
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create project')
      },
    }),
  )

  const resetForm = () => {
    form.reset()
    setIsComplete(false)
  }

  const handleClose = () => {
    if (!createProjectMutation.isPending && !isComplete) {
      onOpenChange(false)
      setTimeout(resetForm, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeButton={!isComplete}
        onClose={handleClose}
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
                <Sparkles className="size-6 text-indigo-500" />
                <DialogTitle>Create New Project</DialogTitle>
              </motion.div>
              <DialogDescription>
                Fill in the details below. New fields will appear as you type.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-6">
              <ProjectForm form={form} />
            </DialogBody>

            <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createProjectMutation.isPending}
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
                  form.state.isSubmitting || createProjectMutation.isPending
                }
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Create Project
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
              <h3 className="text-xl font-semibold mb-2">Project Created!</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Your project has been created successfully
              </p>
            </motion.div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  )
}
