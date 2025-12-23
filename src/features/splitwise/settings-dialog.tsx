import { z } from 'zod'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useAppForm } from '@/hooks/personally.form'
import { useTRPC } from '@/integrations/trpc/react'
import { useStore } from '@tanstack/react-form'
import { useMediaQuery } from '@/hooks/use-media-query'

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
    const isDesktop = useMediaQuery('(min-width: 768px)')

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

    // Form content - shared between Dialog and Drawer
    const formContent = (
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
            <div className="flex mt-2 justify-end w-full">
                <form.AppForm>
                    <form.SubmitButton label="Submit" />
                </form.AppForm>
            </div>
        </form>
    )

    // Desktop: Dialog
    if (isDesktop) {
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
                    {formContent}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile: Drawer
    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="size-4" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh] overflow-y-auto">
                <DrawerHeader className="text-left">
                    <DrawerTitle>Customize Splitwise Settings</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4">
                    {formContent}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
