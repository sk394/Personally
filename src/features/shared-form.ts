import { formOptions } from "@tanstack/react-form";
import { unknown } from "zod";

export type InvitationInput = {
    id: string;
    email: string;
    name: string;
};

export const projectOpts = formOptions({
    defaultValues: {
        title: '',
        description: null as string | null,
        visibility: 'public' as 'private' | 'shared' | 'public',
        icon: null as string | null,
        maxMembers: 10,
        invitations: [] as InvitationInput[],
        currentInviteEmail: '',
        currentInviteName: '',
    },
})

export const loanOpts = formOptions({
    defaultValues: {
        projectId: '',
        type: "borrowed" as "borrowed" | "lent",
        contactName: "",
        contactEmail: "",
        principalAmount: 0.1,
        currency: "USD",
        hasInterest: false,
        interestRate: 0.02, //2%
        loanDate: new Date(),
        dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        notes: "",
        attachments: null as { name: string; url: string }[] | null,
    },
})
