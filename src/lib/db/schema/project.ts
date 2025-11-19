import { timestamps } from "@/lib/db/columns.helpers";
import { invitationStatusEnum, memberRoleEnum, visibilityEnum } from "@/lib/db/enums";
import { user } from "@/lib/db/schema/auth";
import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const projectTemplate = pgTable("project_template", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    category: varchar('category', { length: 50 }), // 'loans', 'splitwise', 'emi', 'expense_tracking', etc.
    isDefault: boolean("is_default").default(true).notNull(),
    config: jsonb("config"), // JSON configuration for the project template
    ...timestamps
});

export const project = pgTable('project', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => projectTemplate.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }), // can override template icon
    isCustom: boolean('is_custom').default(false).notNull(),
    visibility: visibilityEnum('visibility').default('private').notNull(),
    maxMembers: integer('max_members').default(50),
    ...timestamps
});

export const projectMember = pgTable('project_member', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    addedBy: text('added_by').references(() => user.id),
});

export const projectInvitation = pgTable('project_invitation', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
    invitedBy: text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),

    // For existing users
    invitedUserId: text('invited_user_id').references(() => user.id, { onDelete: 'cascade' }),

    // For non-existing users
    invitedEmail: varchar('invited_email', { length: 255 }).notNull(),
    invitedName: varchar('invited_name', { length: 255 }), // optional

    status: invitationStatusEnum('status').default('pending').notNull(),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    respondedAt: timestamp('responded_at'),
    expiresAt: timestamp('expires_at').default(sql`CURRENT_TIMESTAMP + INTERVAL '7 days'`).notNull(),
});

export type ProjectTemplate = typeof projectTemplate.$inferSelect;
export type NewProjectTemplate = typeof projectTemplate.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type ProjectMember = typeof projectMember.$inferSelect;
export type NewProjectMember = typeof projectMember.$inferInsert;

export type ProjectInvitation = typeof projectInvitation.$inferSelect;
export type NewProjectInvitation = typeof projectInvitation.$inferInsert;

// Schema for projects - used to validate API requests
export const insertProjectSchema = createInsertSchema(project);
export const insertProjectMemberSchema = createInsertSchema(projectMember).extend({}).omit({
    id: true,
    joinedAt: true,
});
export const insertProjectInvitationSchema = createInsertSchema(projectInvitation).extend({}).omit({
    id: true,
    invitedAt: true,
    respondedAt: true,
});
export const insertProjectTemplateSchema = createSelectSchema(projectTemplate).extend({}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});
