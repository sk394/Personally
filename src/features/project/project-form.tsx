import { ChevronDown, Globe, Lock, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { InvitationInput } from '@/features/shared-form';
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { projectOpts } from '@/features/shared-form'
import { withForm } from '@/hooks/personally.form'
import { cn } from '@/lib/utils'
import { ProjectTypeSelector } from '@/components/project/project-type-selector'

export const ProjectForm = withForm({
  ...projectOpts,
  // Optional, but adds props to the `render` function outside of `form`
  props: {
    // title: 'Child Form',
  },
  render: ({ form }) => {
    // const [fieldInteractions, setFieldInteractions] = useState<{
    //   projectType: boolean
    //   title: boolean
    //   description: boolean
    //   visibility: 'private' | 'shared' | 'public' | ''
    // }>({
    //   projectType: false,
    //   title: false,
    //   description: false,
    //   visibility: '' as 'private' | 'shared' | 'public' | '',
    // })

    return (
      <div className="flex flex-col gap-2">
        {/* Project Type Selection - Always visible first */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <Label className="text-base font-semibold">Project Type</Label>
          <form.AppField
            name="projectType"
          // listeners={{
          //   onChange: () => {
          //     if (!fieldInteractions.projectType) {
          //       setFieldInteractions((prev) => ({
          //         ...prev,
          //         projectType: true,
          //         title: true,
          //       }))
          //     }
          //   },
          // }}
          >
            {(field) => (
              <ProjectTypeSelector
                selectedType={field.state.value}
                onTypeSelect={(type) => {
                  field.handleChange(type)
                }}
              />
            )}
          </form.AppField>
        </motion.div>

        {/* Title Field - Appears after project type selection */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-2 overflow-hidden"
          >
            <form.AppField
              name="title"
            // listeners={{
            //   onChange: () => {
            //     if (!fieldInteractions.title) {
            //       setFieldInteractions((prev) => ({
            //         ...prev,
            //         title: true,
            //       }))
            //     }
            //   },
            // }}
            >
              {(field) => (
                <>
                  <field.PersonallyTextField
                    label="Project Title"
                    required
                    placeholder="e.g., Family Vacation Fund, Home Renovation, Wedding Budget..."
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {field.state.value?.length ?? 0}/255 characters
                  </p>
                </>
              )}
            </form.AppField>
          </motion.div>
        </AnimatePresence>

        {/* Description Field - Appears after title */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-2 overflow-hidden"
          >
            <form.AppField
              name="description"
            >
              {(field) => (
                <field.PersonallyTextArea
                  label="Description"
                  placeholder="Describe the purpose and goals of this project..."
                  fieldDescription="Add details to help team members understand the project's purpose"
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
            className="space-y-3 overflow-hidden"
          >
            <form.AppField
              name="visibility"
              validators={{
                onBlur: ({ value }: { value: string }) => {
                  if (!value) {
                    return 'Please select a visibility option'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <field.ChoiceCardField
                  label="Project Visibility"
                  fieldDescription="Select the visibility"
                  options={[
                    {
                      value: 'private',
                      label: 'Private',
                      description:
                        'Only you and invited members can see this project',
                      icon: (
                        <Lock
                          className={cn(
                            'size-5 mt-0.5',
                            field.state.value === 'private'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-600 dark:text-zinc-400',
                          )}
                        />
                      ),
                    },
                    {
                      value: 'shared',
                      label: 'Shared',
                      description:
                        'Anyone with the link can view this project',
                      icon: (
                        <Users
                          className={cn(
                            'size-5 mt-0.5',
                            field.state.value === 'shared'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-600 dark:text-zinc-400',
                          )}
                        />
                      ),
                    },
                    {
                      value: 'public',
                      label: 'Public',
                      description:
                        'Anyone can discover and view this project',
                      icon: (
                        <Globe
                          className={cn(
                            'size-5 mt-0.5',
                            field.state.value === 'public'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-600 dark:text-zinc-400',
                          )}
                        />
                      ),
                    },
                  ]}
                />
              )}
            </form.AppField>
          </motion.div>
        </AnimatePresence>

        {/* Invitations Field - Appears after icon */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <ChevronDown className="size-4 text-indigo-500" />
              <Label className="text-base font-semibold">
                Invite Team Members
                <span className="text-xs font-normal text-zinc-500 ml-2">
                  (Optional)
                </span>
              </Label>
            </div>

            <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="space-y-2">
                <form.AppField name="currentInviteEmail">
                  {(field) => (
                    <field.EmailField
                      placeholder="Email Address"
                      className="pl-10"
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()

                          if (field.state.meta.errors.length > 0) {
                            toast.error(
                              'Please fix errors before adding invitation',
                            )
                            return
                          }

                          const email = form.state.values.currentInviteEmail

                          if (email.trim()) {
                            form.setFieldValue('invitations', [
                              ...form.state.values.invitations,
                              {
                                id: crypto.randomUUID(),
                                email,
                                name: form.state.values.currentInviteName,
                              },
                            ])
                            form.setFieldValue('currentInviteEmail', '')
                            form.setFieldValue('currentInviteName', '')
                            toast.success('Invitation added')
                          }
                        }
                      }}
                    />
                  )}
                </form.AppField>

                <form.AppField name="currentInviteName">
                  {(field) => (
                    <field.PersonallyTextField
                      placeholder="Name (optional)"
                      className="h-9"
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const email = form.state.values.currentInviteEmail
                          if (email.trim()) {
                            form.setFieldValue('invitations', [
                              ...form.state.values.invitations,
                              {
                                id: crypto.randomUUID(),
                                email,
                                name: form.state.values.currentInviteName,
                              },
                            ])
                            form.setFieldValue('currentInviteEmail', '')
                            form.setFieldValue('currentInviteName', '')
                            toast.success('Invitation added')
                          }
                        }
                      }}
                    />
                  )}
                </form.AppField>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const email = form.state.values.currentInviteEmail
                    if (email.trim()) {
                      form.setFieldValue('invitations', [
                        ...form.state.values.invitations,
                        {
                          id: crypto.randomUUID(),
                          email,
                          name: form.state.values.currentInviteName,
                        },
                      ])
                      form.setFieldValue('currentInviteEmail', '')
                      form.setFieldValue('currentInviteName', '')
                      toast.success('Invitation added')
                    }
                  }}
                  className="w-full"
                  size="sm"
                >
                  <Users className="size-4" />
                  Add Invitation
                </Button>
              </div>

              <form.AppField name="invitations">
                {(field) => (
                  <>
                    {field.state.value.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-xs text-zinc-500">
                          {field.state.value.length}{' '}
                          {field.state.value.length === 1
                            ? 'invitation'
                            : 'invitations'}{' '}
                          added
                        </Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          <AnimatePresence>
                            {field.state.value.map(
                              (invite: InvitationInput) => (
                                <motion.div
                                  key={invite.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
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
                                    onClick={() => {
                                      field.handleChange(
                                        field.state.value.filter(
                                          (inv: InvitationInput) =>
                                            inv.id !== invite.id,
                                        ),
                                      )
                                    }}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </motion.div>
                              ),
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </form.AppField>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  },
})
