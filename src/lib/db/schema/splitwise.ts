import { timestamps } from "@/lib/db/columns.helpers";
import { expenseSplitTypeEnum, paymentMethodEnum, settlementStatusEnum } from "@/lib/db/enums";
import { project } from "@/lib/db/schema";
import { user } from "@/lib/db/schema/auth";
import { sql } from "drizzle-orm";
import { boolean, check, doublePrecision, integer, pgTable, real, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";


export const splitwiseSetting = pgTable("splitwise_setting", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }).unique(), // associated project

    // Interest settings
    enableInterest: boolean('enable_interest').default(false).notNull(),
    interestRate: real('interest_rate'),
    interestStartMonths: integer('interest_start_months'), // after how many months to start charging interest

    // general setting
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    ...timestamps
},
    (table) => [
        check("valid_interest_rate", sql`${table.interestRate} >= 0 AND ${table.interestRate} < 1`),
    ]
);

export const expense = pgTable('expense', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),

    // Who paid
    paidBy: text('paid_by').notNull().references(() => user.id, { onDelete: 'cascade' }),

    // Expense details
    description: varchar('description', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }), // 'groceries', 'rent', 'utilities', 'entertainment', etc.
    amount: integer('amount').notNull(), // in cents
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),

    // How to split
    splitType: expenseSplitTypeEnum('split_type').default('equal').notNull(),

    // Date and metadata
    expenseDate: timestamp('expense_date').notNull(),
    notes: text('notes'),
    receiptUrl: varchar('receipt_url', { length: 500 }),
    ...timestamps
});

// Individual splits for each expense
export const expenseSplit = pgTable('expense_split', {
    id: uuid('id').defaultRandom().primaryKey(),
    expenseId: uuid('expense_id').notNull().references(() => expense.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),

    // How much this user owes for this expense
    amount: integer('amount').notNull(), // in cents
    percentage: doublePrecision('percentage'),
    shares: integer('shares'), // for share-based splits

    isPayer: boolean('is_payer').default(false).notNull(), // true if this user paid

    ...timestamps
});

export const balance = pgTable('balance', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),

    // User A owes User B
    fromUserId: text('from_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // debtor
    toUserId: text('to_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // creditor

    // Balance details
    amount: integer('amount').notNull(), // in cents, positive means fromUserId owes toUserId
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),

    // Interest tracking
    baseAmount: integer('base_amount').notNull(), // original amount without interest
    accruedInterest: integer('accrued_interest').default(0).notNull(), // in cents
    lastInterestCalculation: timestamp('last_interest_calculation'),
    interestStartDate: timestamp('interest_start_date'), // when interest should start accruing

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const settlement = pgTable('settlement', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),

    // Payment details
    fromUserId: text('from_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // who paid
    toUserId: text('to_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // who received

    amount: integer('amount').notNull(), // in cents
    principalAmount: integer('principal_amount').notNull(), // amount toward principal
    interestAmount: integer('interest_amount').default(0).notNull(), // amount toward interest
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),

    // Settlement details
    status: settlementStatusEnum('status').default('pending').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').default('zelle').notNull(),
    notes: text('notes'),

    // Dates
    settlementDate: timestamp('settlement_date').notNull(),
    verifiedAt: timestamp('verified_at'),
    verifiedBy: text('verified_by').references(() => user.id),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    createdBy: text('created_by').notNull().references(() => user.id),
});

//typescript static types - compile time only
export type Expense = typeof expense.$inferSelect;
export type ExpenseSplit = typeof expenseSplit.$inferSelect;
export type Balance = typeof balance.$inferSelect;
export type Settlement = typeof settlement.$inferSelect;

export type NewExpense = typeof expense.$inferInsert;
export type NewExpenseSplit = typeof expenseSplit.$inferInsert;
export type NewBalance = typeof balance.$inferInsert;
export type NewSettlement = typeof settlement.$inferInsert;

// zod schemas for runtime validation
export const SplitwiseSettingSelectSchema = createSelectSchema(splitwiseSetting);
export const ExpenseSelectSchema = createSelectSchema(expense);
export const ExpenseSplitSelectSchema = createSelectSchema(expenseSplit);
export const BalanceSelectSchema = createSelectSchema(balance);
export const SettlementSelectSchema = createSelectSchema(settlement);

export const splitwiseSettingInsertSchema = createInsertSchema(splitwiseSetting);
export const ExpenseInsertSchema = createInsertSchema(expense);
export const ExpenseSplitInsertSchema = createInsertSchema(expenseSplit);
export const BalanceInsertSchema = createInsertSchema(balance);
export const SettlementInsertSchema = createInsertSchema(settlement);

