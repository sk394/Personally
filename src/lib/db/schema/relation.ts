import { relations } from 'drizzle-orm'
import { user } from '@/lib/db/schema/auth'
import { loan, loanPayment } from '@/lib/db/schema/loan'
import {
  project,
  projectInvitation,
  projectMember,
} from '@/lib/db/schema/project'
import {
  balance,
  expense,
  expenseSplit,
  settlement,
  splitwiseSetting,
} from '@/lib/db/schema/splitwise'

// Users Relations
export const usersRelations = relations(user, ({ many }) => ({
  projects: many(project),
  projectMemberships: many(projectMember),
  sentInvitations: many(projectInvitation, { relationName: 'inviter' }),
  receivedInvitations: many(projectInvitation, { relationName: 'invitee' }),
}))

// project relations
export const projectsRelations = relations(project, ({ one, many }) => ({
  owner: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  members: many(projectMember),
  invitations: many(projectInvitation),
}))

// project member relations
export const projectMembersRelations = relations(projectMember, ({ one }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
  addedByUser: one(user, {
    fields: [projectMember.addedBy],
    references: [user.id],
  }),
}))

// Project Invitations Relations
export const projectInvitationsRelations = relations(
  projectInvitation,
  ({ one }) => ({
    project: one(project, {
      fields: [projectInvitation.projectId],
      references: [project.id],
    }),
    inviter: one(user, {
      fields: [projectInvitation.invitedBy],
      references: [user.id],
      relationName: 'inviter',
    }),
    invitedUser: one(user, {
      fields: [projectInvitation.invitedUserId],
      references: [user.id],
      relationName: 'invitee',
    }),
  }),
)

// splitwise relations
export const splitwiseSettingsRelations = relations(
  splitwiseSetting,
  ({ one }) => ({
    project: one(project, {
      fields: [splitwiseSetting.projectId],
      references: [project.id],
    }),
  }),
)

// expenses relations
export const expensesRelations = relations(expense, ({ one, many }) => ({
  project: one(project, {
    fields: [expense.projectId],
    references: [project.id],
  }),
  payer: one(user, {
    fields: [expense.paidBy],
    references: [user.id],
  }),
  splits: many(expenseSplit),
}))

// expense splits relations
export const expenseSplitsRelations = relations(expenseSplit, ({ one }) => ({
  expense: one(expense, {
    fields: [expenseSplit.expenseId],
    references: [expense.id],
  }),
  user: one(user, {
    fields: [expenseSplit.userId],
    references: [user.id],
  }),
}))

// balances relations
export const balancesRelations = relations(balance, ({ one }) => ({
  project: one(project, {
    fields: [balance.projectId],
    references: [project.id],
  }),
  debtor: one(user, {
    fields: [balance.fromUserId],
    references: [user.id],
    relationName: 'debtor',
  }),
  creditor: one(user, {
    fields: [balance.toUserId],
    references: [user.id],
    relationName: 'creditor',
  }),
}))

// settlements relations
export const settlementsRelations = relations(settlement, ({ one }) => ({
  project: one(project, {
    fields: [settlement.projectId],
    references: [project.id],
  }),
  payer: one(user, {
    fields: [settlement.fromUserId],
    references: [user.id],
    relationName: 'payer',
  }),
  receiver: one(user, {
    fields: [settlement.toUserId],
    references: [user.id],
    relationName: 'receiver',
  }),
  verifier: one(user, {
    fields: [settlement.verifiedBy],
    references: [user.id],
    relationName: 'verifier',
  }),
  creator: one(user, {
    fields: [settlement.createdBy],
    references: [user.id],
    relationName: 'creator',
  }),
}))

//
export const loansRelations = relations(loan, ({ one, many }) => ({
  project: one(project, {
    fields: [loan.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [loan.userId],
    references: [user.id],
  }),
  payments: many(loanPayment),
}))

// loan payments relations
export const loanPaymentsRelations = relations(loanPayment, ({ one }) => ({
  loan: one(loan, {
    fields: [loanPayment.loanId],
    references: [loan.id],
  }),
  createdByUser: one(user, {
    fields: [loanPayment.createdBy],
    references: [user.id],
  }),
}))
