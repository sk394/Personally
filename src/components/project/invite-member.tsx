import { useState } from 'react'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckCircle2,
    Loader2,
    Mail,
    UserPlus,
    AlertCircle,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAppForm } from '@/hooks/personally.form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useTRPC } from '@/integrations/trpc/react'

interface InviteMemberComponentProps {
    projectId: string
    projectTitle?: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

const inviteSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    name: z.string().min(1, 'Name is required'),
})

export function InviteMemberComponent({
    projectId,
    projectTitle,
    open,
    onOpenChange,
}: InviteMemberComponentProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [isComplete, setIsComplete] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

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
            onSuccess: (data) => {
                queryClient.invalidateQueries({
                    queryKey: [['project', 'getMembers']],
                })
                queryClient.invalidateQueries({
                    queryKey: [['project', 'getInvitations']],
                })
                setSuccessMessage(data.message || 'Invitation sent successfully!')
                setIsComplete(true)
                setTimeout(() => {
                    handleClose()
                }, 2500)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to send invitation')
            },
        }),
    )

    const resetForm = () => {
        form.reset()
        setIsComplete(false)
        setSuccessMessage('')
    }

    const handleClose = () => {
        if (!inviteMutation.isPending) {
            onOpenChange(false)
            setTimeout(resetForm, 300)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <AnimatePresence mode="wait">
                    {!isComplete ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <UserPlus className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle>Invite Team Member</DialogTitle>
                                        <DialogDescription>
                                            {projectTitle
                                                ? `Add someone to "${projectTitle}"`
                                                : 'Add someone to your project'}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    form.handleSubmit()
                                }}
                                className="space-y-6 mt-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Email Address <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <form.Field name="email">
                                                {(field) => (
                                                    <>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="colleague@example.com"
                                                            className="pl-9"
                                                            value={field.state.value}
                                                            onChange={(e) => field.handleChange(e.target.value)}
                                                            disabled={inviteMutation.isPending}
                                                        />
                                                        {field.state.meta.errors && (
                                                            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                                <AlertCircle className="size-3" />
                                                                {field.state.meta.errors.join(', ')}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </form.Field>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            They'll receive a dashboard notification if they have an
                                            account
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Name <span className="text-red-500">*</span>
                                        </Label>
                                        <form.Field name="name">
                                            {(field) => (
                                                <>
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        placeholder="John Doe"
                                                        value={field.state.value}
                                                        onChange={(e) => field.handleChange(e.target.value)}
                                                        disabled={inviteMutation.isPending}
                                                    />
                                                    {field.state.meta.errors && (
                                                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                                            <AlertCircle className="size-3" />
                                                            {field.state.meta.errors.join(', ')}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </form.Field>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClose}
                                        disabled={inviteMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={inviteMutation.isPending}>
                                        {inviteMutation.isPending ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="size-4" />
                                                Send Invitation
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="py-8 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4"
                            >
                                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                            </motion.div>
                            <h3 className="text-lg font-semibold mb-2">Invitation Sent!</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                {successMessage}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
