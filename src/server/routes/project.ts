import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import {
  createProjectRequestSchema,
  inviteMemberRequestSchema,
  project,
  projectInvitation,
  projectMember,
  updateProjectRequestSchema,
} from '@/lib/db/schema/project'
import { user } from '@/lib/db/schema/auth'
import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init'

export const projectRouter = createTRPCRouter({
  // Get all projects for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id

    // Get projects where user is the owner
    const ownedProjects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))

    // Get projects where user is a member
    const memberProjects = await db
      .select({
        project: project,
        member: projectMember,
      })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .where(eq(projectMember.userId, userId))

    return {
      owned: ownedProjects,
      member: memberProjects.map((p) => ({
        ...p.project,
        role: p.member.role,
      })),
    }
  }),

  // get members count for project
  getMemberCount: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memberCount = await db
        .select()
        .from(projectMember)
        .where(eq(projectMember.projectId, input.projectId))

      return memberCount.length
    }),

  // Get projects by type for the current user
  getByType: protectedProcedure
    .input(
      z.object({
        projectType: z.enum(['loan', 'splitwise', 'general']),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get projects where user is the owner
      const ownedProjects = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.userId, userId),
            eq(project.projectType, input.projectType),
          ),
        )

      // Get projects where user is a member
      const memberProjects = await db
        .select({
          project: project,
          member: projectMember,
        })
        .from(projectMember)
        .innerJoin(project, eq(projectMember.projectId, project.id))
        .where(
          and(
            eq(projectMember.userId, userId),
            eq(project.projectType, input.projectType),
          ),
        )

      return {
        owned: ownedProjects,
        member: memberProjects.map((p) => ({
          ...p.project,
          role: p.member.role,
        })),
      }
    }),

  // Get user's loan projects (replaces template-based approach)
  getLoanProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id

    // Get projects where user is the owner
    const ownedLoanProjects = await db
      .select()
      .from(project)
      .where(and(eq(project.userId, userId), eq(project.projectType, 'loan')))

    // Get loan projects where user is a member
    const memberLoanProjects = await db
      .select({
        project: project,
        member: projectMember,
      })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .where(
        and(eq(projectMember.userId, userId), eq(project.projectType, 'loan')),
      )

    return {
      owned: ownedLoanProjects,
      member: memberLoanProjects.map((p) => ({
        ...p.project,
        role: p.member.role,
      })),
    }
  }),

  // Get a single project by ID with enhanced validation
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        expectedType: z.enum(['loan', 'splitwise', 'general']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.id))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const proj = projectData[0]

      // Validate project type if expected type is provided
      if (input.expectedType && proj.projectType !== input.expectedType) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Project type mismatch. Expected ${input.expectedType}, got ${proj.projectType}`,
        })
      }

      // Check if user has access to this project
      const isOwner = proj.userId === userId
      const isMember = await db
        .select()
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, input.id),
            eq(projectMember.userId, userId),
          ),
        )
        .limit(1)

      if (!isOwner && !isMember.length && proj.visibility === 'private') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this project',
        })
      }

      // Get project members
      const members = await db
        .select()
        .from(projectMember)
        .where(eq(projectMember.projectId, input.id))

      return {
        ...proj,
        members,
        isOwner,
      }
    }),

  // Create a new project
  create: protectedProcedure
    .input(
      createProjectRequestSchema.extend({
        invitations: z
          .array(
            z.object({
              email: z.string().email(),
              name: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Validate project type
      if (!['loan', 'splitwise', 'general'].includes(input.projectType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Invalid project type. Must be one of: loan, splitwise, general',
        })
      }

      // Create the project without template dependency
      const [newProject] = await db
        .insert(project)
        .values({
          userId,
          title: input.title,
          description: input.description,
          projectType: input.projectType,
          visibility: input.visibility,
          isCustom: true, // All new projects are custom
          maxMembers: input.maxMembers,
        })
        .returning()

      // Add the creator as the owner member
      await db.insert(projectMember).values({
        projectId: newProject.id,
        userId,
        role: 'owner',
        addedBy: userId,
      })

      // Send invitations if provided
      if (input.invitations && input.invitations.length > 0) {
        const invitationValues = input.invitations.map((inv) => ({
          projectId: newProject.id,
          invitedBy: userId,
          invitedEmail: inv.email,
          invitedName: inv.name,
          status: 'pending' as const,
        }))

        await db.insert(projectInvitation).values(invitationValues)
      }

      return {
        success: true,
        project: newProject,
      }
    }),

  // Update a project with enhanced validation
  update: protectedProcedure
    .input(
      updateProjectRequestSchema.extend({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id
      const { id, ...updateData } = input

      // Check if user is the owner or admin
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, id))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const isOwner = projectData[0].userId === userId

      if (!isOwner) {
        // Check if user is an admin
        const member = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, id),
              eq(projectMember.userId, userId),
              eq(projectMember.role, 'admin'),
            ),
          )
          .limit(1)

        if (!member.length) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this project',
          })
        }
      }

      // Note: Project type cannot be changed after creation for data integrity
      // Remove projectType from updateData if it exists
      const { projectType, ...safeUpdateData } = updateData as any

      if (projectType && projectType !== projectData[0].projectType) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project type cannot be changed after creation',
        })
      }

      await db
        .update(project)
        .set({
          ...safeUpdateData,
          updated_at: new Date(),
        })
        .where(eq(project.id, id))

      return { success: true }
    }),

  // Delete a project
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Only the owner can delete a project
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.id))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (projectData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project owner can delete the project',
        })
      }

      await db.delete(project).where(eq(project.id, input.id))

      return { success: true }
    }),

  // Invite a user to a project
  inviteUser: protectedProcedure
    .input(
      inviteMemberRequestSchema.extend({
        projectId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Check if user has permission to invite (owner or admin)
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const isOwner = projectData[0].userId === userId

      if (!isOwner) {
        const member = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, input.projectId),
              eq(projectMember.userId, userId),
              sql`${projectMember.role} IN ('admin', 'owner')`,
            ),
          )
          .limit(1)

        if (!member.length) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to invite users',
          })
        }
      }

      // Check if invitation already exists
      const existingInvitation = await db
        .select()
        .from(projectInvitation)
        .where(
          and(
            eq(projectInvitation.projectId, input.projectId),
            eq(projectInvitation.invitedEmail, input.invitedEmail),
            eq(projectInvitation.status, 'pending'),
          ),
        )
        .limit(1)

      if (existingInvitation.length) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An invitation has already been sent to this email',
        })
      }

      // Check if the invited email belongs to an existing user
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, input.invitedEmail))
        .limit(1)

      // Create invitation with user ID if user exists (for dashboard notifications)
      await db.insert(projectInvitation).values({
        projectId: input.projectId,
        invitedBy: userId,
        invitedEmail: input.invitedEmail,
        invitedName: input.invitedName,
        invitedUserId: existingUser.length > 0 ? existingUser[0].id : null,
        status: 'pending',
        notificationRead: false,
        notificationDismissed: false,
      })

      return {
        success: true,
        message: existingUser.length > 0
          ? 'Invitation sent! The user will see it on their dashboard.'
          : 'Invitation sent! The user will see it when they sign up with this email.'
      }
    }),

  // Get pending invitations for a project
  getInvitations: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Check if user has access to this project
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const isOwner = projectData[0].userId === userId

      if (!isOwner) {
        const member = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, input.projectId),
              eq(projectMember.userId, userId),
            ),
          )
          .limit(1)

        if (!member.length) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this project',
          })
        }
      }

      return await db
        .select()
        .from(projectInvitation)
        .where(eq(projectInvitation.projectId, input.projectId))
    }),

  // Get project members
  getMembers: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Check if user has access to this project
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const isOwner = projectData[0].userId === userId

      if (!isOwner && projectData[0].visibility === 'private') {
        const member = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.projectId, input.projectId),
              eq(projectMember.userId, userId),
            ),
          )
          .limit(1)

        if (!member.length) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this project',
          })
        }
      }

      return await db.query.projectMember.findMany({
        where: eq(projectMember.projectId, input.projectId),
        with: {
          user: true,
        },
      })
    }),

  // Get user's splitwise projects (replaces template-based approach)
  getSplitwiseProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id

    // Get projects where user is the owner
    const ownedSplitwiseProjects = await db
      .select()
      .from(project)
      .where(
        and(eq(project.userId, userId), eq(project.projectType, 'splitwise')),
      )

    // Get splitwise projects where user is a member
    const memberSplitwiseProjects = await db
      .select({
        project: project,
        member: projectMember,
      })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .where(
        and(
          eq(projectMember.userId, userId),
          eq(project.projectType, 'splitwise'),
        ),
      )

    return {
      owned: ownedSplitwiseProjects,
      member: memberSplitwiseProjects.map((p) => ({
        ...p.project,
        role: p.member.role,
      })),
    }
  }),

  // Get pending invitations for the current user (dashboard notifications)
  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id

    // Get invitations by user ID (for existing users)
    const userInvitations = await db
      .select({
        invitation: projectInvitation,
        project: project,
        inviter: user,
      })
      .from(projectInvitation)
      .innerJoin(project, eq(projectInvitation.projectId, project.id))
      .innerJoin(user, eq(projectInvitation.invitedBy, user.id))
      .where(
        and(
          eq(projectInvitation.invitedUserId, userId),
          eq(projectInvitation.status, 'pending'),
          sql`${projectInvitation.expiresAt} > NOW()`,
        ),
      )

    // Get invitations by email (for users who signed up after invitation)
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (!currentUser.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    const emailInvitations = await db
      .select({
        invitation: projectInvitation,
        project: project,
        inviter: user,
      })
      .from(projectInvitation)
      .innerJoin(project, eq(projectInvitation.projectId, project.id))
      .innerJoin(user, eq(projectInvitation.invitedBy, user.id))
      .where(
        and(
          eq(projectInvitation.invitedEmail, currentUser[0].email),
          eq(projectInvitation.status, 'pending'),
          sql`${projectInvitation.expiresAt} > NOW()`,
          sql`${projectInvitation.invitedUserId} IS NULL`,
        ),
      )

    // Combine and format invitations
    const allInvitations = [...userInvitations, ...emailInvitations]

    return allInvitations.map(({ invitation, project: proj, inviter }) => ({
      id: invitation.id,
      projectId: proj.id,
      projectName: proj.title,
      projectType: proj.projectType,
      inviterName: inviter.name,
      invitedAt: invitation.invitedAt,
      expiresAt: invitation.expiresAt,
      notificationRead: invitation.notificationRead,
      notificationDismissed: invitation.notificationDismissed,
    }))
  }),

  // Accept a project invitation
  acceptInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get the invitation
      const invitationData = await db
        .select()
        .from(projectInvitation)
        .where(eq(projectInvitation.id, input.invitationId))
        .limit(1)

      if (!invitationData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      const invitation = invitationData[0]

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation is no longer pending',
        })
      }

      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired',
        })
      }

      // Verify user has permission to accept this invitation
      const currentUser = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (!currentUser.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const canAccept =
        invitation.invitedUserId === userId ||
        invitation.invitedEmail === currentUser[0].email

      if (!canAccept) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to accept this invitation',
        })
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, invitation.projectId),
            eq(projectMember.userId, userId),
          ),
        )
        .limit(1)

      if (existingMember.length) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already a member of this project',
        })
      }

      // Add user as project member
      await db.insert(projectMember).values({
        projectId: invitation.projectId,
        userId,
        role: 'member',
        addedBy: invitation.invitedBy,
      })

      // Update invitation status
      await db
        .update(projectInvitation)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
          invitedUserId: userId, // Link to user if it was email-based
        })
        .where(eq(projectInvitation.id, input.invitationId))

      return { success: true }
    }),

  // Decline a project invitation
  declineInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get the invitation
      const invitationData = await db
        .select()
        .from(projectInvitation)
        .where(eq(projectInvitation.id, input.invitationId))
        .limit(1)

      if (!invitationData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      const invitation = invitationData[0]

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation is no longer pending',
        })
      }

      // Verify user has permission to decline this invitation
      const currentUser = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (!currentUser.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const canDecline =
        invitation.invitedUserId === userId ||
        invitation.invitedEmail === currentUser[0].email

      if (!canDecline) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to decline this invitation',
        })
      }

      // Update invitation status
      await db
        .update(projectInvitation)
        .set({
          status: 'declined',
          respondedAt: new Date(),
          invitedUserId: userId, // Link to user if it was email-based
        })
        .where(eq(projectInvitation.id, input.invitationId))

      return { success: true }
    }),

  // Mark notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get the invitation
      const invitationData = await db
        .select()
        .from(projectInvitation)
        .where(eq(projectInvitation.id, input.invitationId))
        .limit(1)

      if (!invitationData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      const invitation = invitationData[0]

      // Verify user has permission to mark this notification as read
      const currentUser = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (!currentUser.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const canMarkRead =
        invitation.invitedUserId === userId ||
        invitation.invitedEmail === currentUser[0].email

      if (!canMarkRead) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to mark this notification as read',
        })
      }

      // Mark as read
      await db
        .update(projectInvitation)
        .set({ notificationRead: true })
        .where(eq(projectInvitation.id, input.invitationId))

      return { success: true }
    }),

  // Dismiss a notification (mark as read/dismissed)
  dismissNotification: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
        markAsRead: z.boolean().optional().default(true),
        dismiss: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get the invitation
      const invitationData = await db
        .select()
        .from(projectInvitation)
        .where(eq(projectInvitation.id, input.invitationId))
        .limit(1)

      if (!invitationData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      const invitation = invitationData[0]

      // Verify user has permission to dismiss this notification
      const currentUser = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (!currentUser.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const canDismiss =
        invitation.invitedUserId === userId ||
        invitation.invitedEmail === currentUser[0].email

      if (!canDismiss) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to dismiss this notification',
        })
      }

      // Update notification flags
      const updateData: any = {}
      if (input.markAsRead) {
        updateData.notificationRead = true
      }
      if (input.dismiss) {
        updateData.notificationDismissed = true
      }

      await db
        .update(projectInvitation)
        .set(updateData)
        .where(eq(projectInvitation.id, input.invitationId))

      return { success: true }
    }),

  // Remove a member from a project
  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        memberId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Check if user is the project owner
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (projectData[0].userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project owner can remove members',
        })
      }

      // Get the member to check if they're trying to remove the owner
      const memberToRemove = await db
        .select()
        .from(projectMember)
        .where(eq(projectMember.id, input.memberId))
        .limit(1)

      if (!memberToRemove.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        })
      }

      if (memberToRemove[0].role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove the project owner',
        })
      }

      // Remove the member
      await db
        .delete(projectMember)
        .where(eq(projectMember.id, input.memberId))

      return { success: true }
    }),

  // Cancel a pending invitation
  cancelInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Get the invitation
      const invitationData = await db
        .select()
        .from(projectInvitation)
        .where(eq(projectInvitation.id, input.invitationId))
        .limit(1)

      if (!invitationData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      const invitation = invitationData[0]

      // Check if user is the project owner or the one who sent the invitation
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, invitation.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const isOwner = projectData[0].userId === userId
      const isInviter = invitation.invitedBy === userId

      if (!isOwner && !isInviter) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this invitation',
        })
      }

      // Delete the invitation
      await db
        .delete(projectInvitation)
        .where(eq(projectInvitation.id, input.invitationId))

      return { success: true }
    }),

  // Leave a project (for non-owners)
  leave: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id

      // Check if user is the project owner
      const projectData = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1)

      if (!projectData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      if (projectData[0].userId === userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project owners cannot leave their own project. Delete the project instead.',
        })
      }

      // Find and remove the user's membership
      const membershipData = await db
        .select()
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, input.projectId),
            eq(projectMember.userId, userId),
          ),
        )
        .limit(1)

      if (!membershipData.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not a member of this project',
        })
      }

      await db
        .delete(projectMember)
        .where(eq(projectMember.id, membershipData[0].id))

      return { success: true }
    }),
})
