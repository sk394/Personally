import { pgEnum } from "drizzle-orm/pg-core";

export const transactionTypeEnum = pgEnum('transaction_type', ['expense', 'income']);

export const visibilityEnum = pgEnum('visibility', ['private', 'shared', 'public']);

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member', 'viewer']);

export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined', 'expired']);

export const loanTypeEnum = pgEnum('loan_type', ['borrowed', 'lent']);

export const loanStatusEnum = pgEnum('loan_status', ['active', 'paid', 'overdue', 'partially_paid']);

export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'zelle']);

export const expenseSplitTypeEnum = pgEnum('expense_split_type', ['equal', 'exact', 'percentage', 'shares']);

export const settlementStatusEnum = pgEnum('settlement_status', ['pending', 'paid', 'verified']);