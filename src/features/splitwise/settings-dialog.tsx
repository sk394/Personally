import { z } from 'zod'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppForm } from '@/hooks/personally.form'
import { useTRPC } from '@/integrations/trpc/react'
import { useStore } from '@tanstack/react-form'

const settingsSchema = z.object({
    enableInterest: z.boolean(),
    interestRate: z.number().min(0.01).max(1).optional(),
    interestStartMonths: z.number().min(1).optional(),
    currency: z.string().length(3),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface SettingsDialogProps {
    projectId: string
    initialSettings?: Partial<SettingsFormValues> | null
}

export function SettingsDialog({ projectId, initialSettings }: SettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const trpc = useTRPC()
    const queryClient = useQueryClient()

    const updateSettingsMutation = useMutation(
        trpc.splitwise.updateSettings.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['splitwise', 'getSettings']],
                })
                toast.success('Settings updated')
                setOpen(false)
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to update settings')
            },
        }),
    )

    const form = useAppForm({
        defaultValues: {
            enableInterest: initialSettings?.enableInterest ?? false,
            interestRate: initialSettings?.interestRate ?? 0,
            interestStartMonths: initialSettings?.interestStartMonths ?? 0,
            currency: initialSettings?.currency ?? 'USD',
        } as SettingsFormValues,
        validators: {
            onSubmit: settingsSchema,
        },
        onSubmit: async ({ value }) => {
            await updateSettingsMutation.mutateAsync({
                projectId,
                ...value,
            })
        },
    })
    const enableInterest = useStore(form.store, (state) => state.values.enableInterest)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Customize Splitwise Settings</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        form.handleSubmit()
                    }}
                    className="space-y-4 pt-4"
                >
                    <form.AppField
                        name="currency"
                        children={(field) => (
                            <field.SelectField
                                label="Currency"
                                placeholder="Select currency"
                                values={[
                                    { label: 'USD - US Dollar', value: 'USD' },
                                    { label: 'EUR - Euro', value: 'EUR' },
                                    { label: 'GBP - British Pound', value: 'GBP' },
                                    { label: 'INR - Indian Rupee', value: 'INR' },
                                ]}
                            />
                        )}
                    />

                    <form.AppField
                        name="enableInterest"
                        children={(field) => (
                            <field.SwitchField
                                label="Enable Interest"
                                description="Charge interest on unpaid balances"
                            />
                        )}
                    />

                    {enableInterest && (
                        <>
                            <form.AppField
                                name="interestRate"
                                children={(field) => (
                                    <field.NumberField
                                        label="How much interest to charge?"
                                        placeholder="0.05"
                                        required
                                    />
                                )}
                            />
                            <form.AppField
                                name="interestStartMonths"
                                children={(field) => (
                                    <field.NumberField
                                        label="How many months before interest starts?"
                                        placeholder="2"
                                        required
                                    />
                                )}
                            />
                        </>
                    )}
                    <div className="flex justify-end mt-2">
                        <form.AppForm>
                            <form.SubmitButton label="Submit" />
                        </form.AppForm>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
