import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { user } from '@/lib/db/schema/auth'
import {
  invitationStatusEnum,
  memberRoleEnum,
  projectTypeEnum,
  visibilityEnum,
} from '@/lib/db/enums'
import { timestamps } from '@/lib/db/columns.helpers'

export const project = pgTable('project', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  projectType: projectTypeEnum('project_type').default('general').notNull(),
  isCustom: boolean('is_custom').default(false).notNull(),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  maxMembers: integer('max_members').default(50),
  ...timestamps,
})

export const projectMember = pgTable('project_member', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  addedBy: text('added_by').references(() => user.id),
})

export const projectInvitation = pgTable('project_invitation', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  invitedBy: text('invited_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // For existing users
  invitedUserId: text('invited_user_id').references(() => user.id, {
    onDelete: 'cascade',
  }),

  // For non-existing users
  invitedEmail: varchar('invited_email', { length: 255 }).notNull(),
  invitedName: varchar('invited_name', { length: 255 }), // optional

  status: invitationStatusEnum('status').default('pending').notNull(),
  notificationRead: boolean('notification_read').default(false).notNull(),
  notificationDismissed: boolean('notification_dismissed')
    .default(false)
    .notNull(),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  expiresAt: timestamp('expires_at')
    .default(sql`CURRENT_TIMESTAMP + INTERVAL '7 days'`)
    .notNull(),
})

// Base database types
export type Project = typeof project.$inferSelect
export type NewProject = typeof project.$inferInsert

export type ProjectMember = typeof projectMember.$inferSelect
export type NewProjectMember = typeof projectMember.$inferInsert

export type ProjectInvitation = typeof projectInvitation.$inferSelect
export type NewProjectInvitation = typeof projectInvitation.$inferInsert

// Enhanced TypeScript interfaces for better type safety

export interface ProjectWithMembers extends Project {
  members?: Array<ProjectMember>
  memberCount?: number
  userRole?: 'owner' | 'admin' | 'member' | 'viewer'
}

export interface ProjectListItem {
  id: string
  title: string
  description?: string
  projectType: 'loan' | 'splitwise' | 'general'
  icon?: string
  visibility: 'private' | 'shared' | 'public'
  memberCount: number
  userRole: 'owner' | 'admin' | 'member' | 'viewer'
  createdAt: Date
  updatedAt: Date
}

export interface InvitationNotification {
  id: string
  projectId: string
  projectName: string
  projectType: 'loan' | 'splitwise' | 'general'
  inviterName: string
  invitedAt: Date
  expiresAt: Date
  notificationRead: boolean
  notificationDismissed: boolean
}

export interface CreateProjectRequest {
  title: string
  description?: string
  projectType: 'loan' | 'splitwise' | 'general'
  visibility?: 'private' | 'shared' | 'public'
  maxMembers?: number
}

export interface UpdateProjectRequest {
  title?: string
  description?: string
  visibility?: 'private' | 'shared' | 'public'
  maxMembers?: number
  icon?: string
}

export interface InviteMemberRequest {
  invitedEmail: string
  invitedName?: string
}

export interface ProjectTypeOption {
  type: 'loan' | 'splitwise' | 'general'
  name: string
  description: string
  icon: string
}

// Zod schemas for validation - used to validate API requests

// Project schemas
export const insertProjectSchema = createInsertSchema(project, {
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(255, 'Project title too long'),
  description: z.string().optional(),
  projectType: z.enum(['loan', 'splitwise', 'general']),
  visibility: z.enum(['private', 'shared', 'public']),
  maxMembers: z.number().int().min(1).max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
})

export const selectProjectSchema = createSelectSchema(project)

export const updateProjectSchema = insertProjectSchema.partial().omit({
  userId: true,
})

// Project member schemas
export const insertProjectMemberSchema = createInsertSchema(projectMember, {
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
}).omit({
  id: true,
  joinedAt: true,
})

export const selectProjectMemberSchema = createSelectSchema(projectMember)

// Project invitation schemas
export const insertProjectInvitationSchema = createInsertSchema(
  projectInvitation,
  {
    invitedEmail: z.string().email('Invalid email address'),
    invitedName: z.string().min(1, 'Name is required').optional(),
    status: z.enum(['pending', 'accepted', 'declined', 'expired']),
  },
).omit({
  id: true,
  invitedAt: true,
  respondedAt: true,
  notificationRead: true,
  notificationDismissed: true,
  expiresAt: true,
})

export const selectProjectInvitationSchema =
  createSelectSchema(projectInvitation)

export const updateProjectInvitationSchema = z.object({
  status: z.enum(['accepted', 'declined']).optional(),
  notificationRead: z.boolean().optional(),
  notificationDismissed: z.boolean().optional(),
})

// Enhanced validation schemas for API requests

export const createProjectRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(255, 'Project title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  projectType: z.enum(['loan', 'splitwise', 'general']),
  visibility: z.enum(['private', 'shared', 'public']).default('private'),
  maxMembers: z.number().int().min(1).max(1000).default(50),
})

export const updateProjectRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .max(255, 'Project title too long')
    .optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
  maxMembers: z.number().int().min(1).max(1000).optional(),
})

export const inviteMemberRequestSchema = z.object({
  invitedEmail: z.string().email('Invalid email address'),
  invitedName: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .optional(),
})

export const projectTypeOptionSchema = z.object({
  type: z.enum(['loan', 'splitwise', 'general']),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
})

// Validation for project type enum specifically
export const projectTypeSchema = z.enum(['loan', 'splitwise', 'general'])
