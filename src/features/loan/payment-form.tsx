import { InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { withForm } from '@/hooks/personally.form'
import z from 'zod'
import { paymentMethodEnum } from '@/lib/db/enums'


const paymentSchema = z.object({
    loanId: z.string().uuid(),
    amount: z.number().positive('Amount must be positive'),
    paymentDate: z.date(),
    paymentMethod: z.enum(paymentMethodEnum.enumValues),
    createdBy: z.string(),
    notes: z.string().optional(),
})

export const PaymentForm = withForm({
    defaultValues: {
        loanId: 'wefwefgefwefwf',
        amount: 0,
        paymentDate: new Date(),
        paymentMethod: 'zelle',
        createdBy: '',
        notes: '',
    } as z.infer<typeof paymentSchema>,
    // Optional, but adds props to the `render` function outside of `form`
    props: {
        userName: '',
        contactName: '',

    },
    render: ({ form, userName, contactName }) => {

        return (
            <div className="flex flex-col space-y-4 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <form.AppField name="amount">
                        {(field) => (
                            <field.NumberField
                                label="Amount"
                                placeholder="Enter amount"
                            >
                                <InputGroupAddon>
                                    <InputGroupText>$</InputGroupText>
                                </InputGroupAddon>
                            </field.NumberField>
                        )}
                    </form.AppField>

                    <form.AppField name="createdBy">
                        {(field) => (
                            <field.SelectField
                                label="Who paid?"
                                placeholder="Select who paid"
                                values={[
                                    { label: "You", value: userName },
                                    { label: contactName, value: contactName },
                                ]}
                            />
                        )}
                    </form.AppField>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <form.AppField name="paymentMethod">
                        {(field) => (
                            <field.SelectField
                                label="Payment Method"
                                placeholder="Select method"
                                values={paymentMethodEnum.enumValues.map((m) => ({
                                    label: m.charAt(0).toUpperCase() + m.slice(1),
                                    value: m,
                                }))}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name="paymentDate">
                        {(field) => (
                            <field.DateField
                                label="Payment Date"
                                placeholder="Pick a date"
                            />
                        )}
                    </form.AppField>

                </div>
                <form.AppField name="notes">
                    {(field) => (
                        <field.PersonallyTextField
                            label="Notes"
                            placeholder="Additional details"
                        />
                    )}
                </form.AppField>
            </div>
        )
    },
})
