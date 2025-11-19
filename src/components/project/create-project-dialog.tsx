import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Loader2,
    Sparkles,
    Users,
    Mail,
    X,
    CheckCircle2,
    Lock,
    Globe
} from "lucide-react"
import { useTRPC } from "@/integrations/trpc/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type StepType =
  | 'title'
  | 'description'
  | 'visibility'
  | 'invitations'
  | 'complete'

interface InvitationInput {
  id: string
  email: string
  name: string
}

const stepOrder: StepType[] = [
  'title',
  'description',
  'visibility',
  'invitations',
  'complete',
]

export function CreateProjectDialogHorizon({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = React.useState<StepType>('title')
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    visibility: 'private' as 'private' | 'shared' | 'public',
  })
  const [invitations, setInvitations] = React.useState<InvitationInput[]>([])
  const [currentInvite, setCurrentInvite] = React.useState({
    email: '',
    name: '',
  })

  const createProjectMutation = useMutation(
    trpc.project.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project'] })
        setCurrentStep('complete')
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
    setFormData({ title: '', description: '', visibility: 'private' })
    setInvitations([])
    setCurrentInvite({ email: '', name: '' })
    setCurrentStep('title')
  }

  const handleClose = () => {
    if (!createProjectMutation.isPending) {
      onOpenChange(false)
      setTimeout(resetForm, 300)
    }
  }

  const canProceedFromTitle = formData.title.trim().length > 0

  const proceedToNextStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, title: value }))

    // Auto-advance when title is entered and user hasn't visited description yet
    if (value.trim().length > 3 && currentStep === 'title') {
      setTimeout(() => {
        if (stepOrder.indexOf(currentStep) === 0) {
          proceedToNextStep()
        }
      }, 300)
    }
  }

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, description: value }))
  }

  const addInvitation = () => {
    if (currentInvite.email.trim()) {
      setInvitations((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ...currentInvite },
      ])
      setCurrentInvite({ email: '', name: '' })
      toast.success('Invitation added')
    }
  }

  const removeInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id))
  }

  const handleSubmit = async () => {
    if (!canProceedFromTitle) {
      toast.error('Please enter a project title')
      return
    }

    createProjectMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      visibility: formData.visibility,
      invitations: invitations.map((inv) => ({
        email: inv.email,
        name: inv.name || undefined,
      })),
    })
  }

  const stepIndicatorPosition = React.useMemo(() => {
    const index = stepOrder.indexOf(currentStep)
    return (index / (stepOrder.length - 1)) * 100
  }, [currentStep])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          closeButton={currentStep !== 'complete'}
          onClose={handleClose}
        >
          {currentStep !== 'complete' && (
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
                {currentStep === 'title' &&
                  "Let's start with a name for your project"}
                {currentStep === 'description' &&
                  'Add more details about your project'}
                {currentStep === 'visibility' &&
                  'Choose who can see your project'}
                {currentStep === 'invitations' &&
                  'Invite people to collaborate'}
              </DialogDescription>

              {/* Progress Indicator */}
              <div className="mt-4 relative h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stepIndicatorPosition}%` }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
                />
              </div>
            </DialogHeader>
          )}

          <DialogBody className={cn(currentStep === 'complete' && 'py-12')}>
            <AnimatePresence mode="wait">
              {currentStep === 'title' && (
                <motion.div
                  key="title"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Family Vacation Fund"
                      value={formData.title}
                      onChange={handleTitleChange}
                      autoFocus
                      maxLength={255}
                      className="text-lg"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formData.title.length}/255 characters
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the purpose of this project..."
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      autoFocus
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 'visibility' && (
                <motion.div
                  key="visibility"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <Label>Project Visibility</Label>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: 'private',
                        }))
                      }
                      className={cn(
                        'w-full p-4 rounded-lg border-2 transition-all text-left',
                        formData.visibility === 'private'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Lock className="size-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            Only you and invited members can see this project
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: 'shared',
                        }))
                      }
                      className={cn(
                        'w-full p-4 rounded-lg border-2 transition-all text-left',
                        formData.visibility === 'shared'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Users className="size-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Shared</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            Anyone with the link can view this project
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: 'public',
                        }))
                      }
                      className={cn(
                        'w-full p-4 rounded-lg border-2 transition-all text-left',
                        formData.visibility === 'public'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Globe className="size-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Public</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            Anyone can discover and view this project
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'invitations' && (
                <motion.div
                  key="invitations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <Label>Invite Team Members (Optional)</Label>

                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 size-4 text-zinc-400" />
                        <Input
                          placeholder="Email address"
                          type="email"
                          value={currentInvite.email}
                          onChange={(e) =>
                            setCurrentInvite((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="pl-10"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addInvitation()
                            }
                          }}
                        />
                      </div>
                      <Input
                        placeholder="Name (optional)"
                        value={currentInvite.name}
                        onChange={(e) =>
                          setCurrentInvite((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addInvitation()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addInvitation}
                        disabled={!currentInvite.email.trim()}
                        className="w-full"
                      >
                        <Users className="size-4" />
                        Add Invitation
                      </Button>
                    </div>

                    {invitations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-xs text-zinc-500">
                          {invitations.length}{' '}
                          {invitations.length === 1
                            ? 'invitation'
                            : 'invitations'}{' '}
                          added
                        </Label>
                        <div className="space-y-2">
                          <AnimatePresence>
                            {invitations.map((invite) => (
                              <motion.div
                                key={invite.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {invite.email}
                                  </div>
                                  {invite.name && (
                                    <div className="text-xs text-zinc-500 truncate">
                                      {invite.name}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeInvitation(invite.id)}
                                >
                                  <X className="size-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 'complete' && (
                <motion.div
                  key="complete"
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
                  <h3 className="text-xl font-semibold mb-2">
                    Project Created!
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Your project has been created successfully
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogBody>

          {currentStep !== 'complete' && (
            <DialogFooter>
              {stepOrder.indexOf(currentStep) > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={createProjectMutation.isPending}
                >
                  Back
                </Button>
              )}

              {currentStep !== 'invitations' ? (
                <Button
                  type="button"
                  onClick={proceedToNextStep}
                  disabled={
                    (currentStep === 'title' && !canProceedFromTitle) ||
                    createProjectMutation.isPending
                  }
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !canProceedFromTitle || createProjectMutation.isPending
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
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
  )
}
