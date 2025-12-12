import { formOptions } from '@tanstack/react-form'
import { unknown } from 'zod'

export type InvitationInput = {
  id: string
  email: string
  name: string
}

export const projectOpts = formOptions({
  defaultValues: {
    title: '',
    description: null as string | null,
    projectType: 'general' as 'loan' | 'splitwise' | 'general',
    visibility: 'public' as 'private' | 'shared' | 'public',
    maxMembers: 10,
    invitations: [] as Array<InvitationInput>,
    currentInviteEmail: '',
    currentInviteName: '',
  },
})

export const loanOpts = formOptions({
  defaultValues: {
    projectId: '24928da9-c8e6-4aa5-999e-6ff39af0e348',
    type: 'borrowed' as 'borrowed' | 'lent',
    contactName: '',
    contactEmail: '',
    principalAmount: 0.1,
    currency: 'USD',
    hasInterest: false,
    interestRate: 0.02, // 2%
    loanDate: new Date(),
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    notes: '',
    attachments: null as Array<{ name: string; url: string }> | null,
  },
})
