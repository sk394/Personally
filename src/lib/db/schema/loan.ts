import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'
import { user } from '@/lib/db/schema/auth'
import { project } from '@/lib/db/schema'
import { loanStatusEnum, loanTypeEnum, paymentMethodEnum } from '@/lib/db/enums'

export const loan = pgTable(
  'loan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }), // loan owner
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }), // associated project
    // loan details
    type: loanTypeEnum('type').notNull(), // 'borrowed' or 'lent'
    contactName: varchar('contact_name', { length: 255 }).notNull(), // name of loanee/lender
    contactEmail: varchar('contact_email', { length: 255 }),
    // financial details
    principalAmount: integer('principal_amount').notNull(), // in cents to avoid decimal issues
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    // Interest details
    hasInterest: boolean('has_interest').default(false).notNull(),
    interestRate: real('interest_rate'),

    loanDate: timestamp('loan_date').notNull(),
    dueDate: timestamp('due_date'),
    status: loanStatusEnum('status').default('active').notNull(),
    totalPaid: integer('total_paid').default(0).notNull(), // total amount paid back in cents

    notes: text('notes'),
    attachments: jsonb('attachments'), // array of attachment metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    closedAt: timestamp('closed_at'),
  },
  (table) => [
    check('positive_principal_amount', sql`${table.principalAmount} > 0`),
    check(
      'valid_interest_rate',
      sql`${table.interestRate} >= 0 AND ${table.interestRate} < 1`,
    ),
  ],
)

export const loanPayment = pgTable('loan_payment', {
  id: uuid('id').defaultRandom().primaryKey(),
  loanId: uuid('loan_id')
    .notNull()
    .references(() => loan.id, { onDelete: 'cascade' }),

  amount: integer('amount').notNull(), // in cents
  paymentDate: timestamp('payment_date').notNull(),

  principalPaid: integer('principal_paid').notNull(), // in cents
  interestPaid: integer('interest_paid').default(0).notNull(), // in cents

  paymentMethod: paymentMethodEnum('payment_method').default('zelle').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
})

export type Loan = typeof loan.$inferSelect
export type LoanPayment = typeof loanPayment.$inferSelect

export const LoanSelectSchema = createSelectSchema(loan, {
  contactEmail: z.string().email().optional(),
})
export const LoanPaymentSelectSchema = createSelectSchema(loanPayment)
export type NewLoan = typeof loan.$inferInsert
export type NewLoanPayment = typeof loanPayment.$inferInsert
// Schema for inserting new loans
export const insertLoanSchema = createInsertSchema(loan)
// Schema for inserting new loan payments
export const InsertLoanPaymentSchema = LoanPaymentSelectSchema.extend({}).omit({
  id: true,
  createdAt: true,
})
