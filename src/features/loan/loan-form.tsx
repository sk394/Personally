import { TrendingDown, TrendingUp, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { FieldGroup } from '@/components/ui/field'
import { InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { loanOpts } from '@/features/shared-form'
import { withForm } from '@/hooks/personally.form'
import { cn } from '@/lib/utils'

export const LoanForm = withForm({
  ...loanOpts,
  // Optional, but adds props to the `render` function outside of `form`
  props: {
    // title: 'Child Form',
  },
  render: ({ form }) => {
    const [hasInterest, setHasInterest] = useState<boolean>()
    const [loanType, setLoanType] = useState<string>()

    return (
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-3 overflow-hidden"
          >
            <form.AppField
              name="type"
              validators={{
                onBlur: ({ value }: { value: string }) => {
                  if (!value) {
                    return 'Please select a loan option'
                  }
                  return undefined
                },
              }}
              listeners={{
                onChange: ({ value }: { value: 'borrowed' | 'lent' }) =>
                  setLoanType(value),
              }}
            >
              {(field) => (
                <field.ChoiceCardField
                  alignment="horizontal"
                  options={[
                    {
                      value: 'borrowed',
                      label: 'Borrowed',
                      description: 'Money you owe to someone',
                      icon: (
                        <TrendingDown
                          className={cn(
                            'size-5 mt-0.5',
                            field.state.value === 'borrowed'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-zinc-600 dark:text-zinc-400',
                          )}
                        />
                      ),
                      backgroundColor: 'bg-red-50 dark:bg-red-950/30 shadow-sm',
                    },
                    {
                      value: 'lent',
                      label: 'Lent',
                      description: 'Money you are owed by someone',
                      icon: (
                        <TrendingUp
                          className={cn(
                            'size-5 mt-0.5',
                            field.state.value === 'lent'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-zinc-600 dark:text-zinc-400',
                          )}
                        />
                      ),
                      backgroundColor:
                        'bg-green-50 dark:bg-green-950/30 shadow-sm',
                    },
                  ]}
                />
              )}
            </form.AppField>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-2 overflow-hidden"
          >
            <FieldGroup>
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <form.AppField name="contactName">
                    {(field) => (
                      <field.PersonallyTextField
                        required
                        placeholder={`${loanType === 'lent' ? 'Who did you lend to?' : 'Who did you borrow from?'}`}
                        placeholderIcon={<User className="text-zinc-400" />}
                      />
                    )}
                  </form.AppField>
                </div>
                <div className="flex-1">
                  <form.AppField name="contactEmail">
                    {(field) => (
                      <field.EmailField placeholder="Email (optional)" />
                    )}
                  </form.AppField>
                </div>
              </div>
            </FieldGroup>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-2 overflow-hidden"
          >
            <div className="mt-1 ">
              <form.AppField
                name="hasInterest"
                listeners={{
                  onChange: () => {
                    setHasInterest(form.state.values.hasInterest)
                  },
                }}
              >
                {(field) => <field.CheckboxField label="Include Interest" />}
              </form.AppField>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <form.AppField name="principalAmount">
                  {(field) => (
                    <>
                      <field.NumberField
                        placeholder="Enter amount"
                        children={
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>USD</InputGroupText>
                          </InputGroupAddon>
                        }
                      />
                      <p className="text-xs text-muted-foreground pl-1">
                        Principal Amount
                      </p>
                    </>
                  )}
                </form.AppField>
              </div>

              {hasInterest && (
                <div className="flex-1 w-full">
                  <form.AppField name="interestRate">
                    {(field) => (
                      <div className="space-y-1">
                        <field.NumberField
                          placeholder="Rate (e.g. 0.05)"
                          children={
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                          }
                        />
                        <p className="text-xs text-muted-foreground pl-1">
                          {field.state.value
                            ? `${(field.state.value * 100).toFixed(1)}% annual`
                            : 'e.g., 0.05 for 5%'}
                        </p>
                      </div>
                    )}
                  </form.AppField>
                </div>
              )}

              <div className="flex-1 w-full">
                <form.AppField name="loanDate">
                  {(field) => <field.DateField placeholder="Loan Date" />}
                </form.AppField>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-3 overflow-hidden"
          >
            <form.AppField name="notes">
              {(field) => (
                <field.PersonallyTextArea
                  placeholder="Additional details about the loan"
                  rows={2}
                />
              )}
            </form.AppField>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  },
})
