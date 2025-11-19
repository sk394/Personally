import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
    project,
    projectTemplate,
    projectMember,
    projectInvitation,
    insertProjectSchema
} from '@/lib/db/schema/project'
import { createTRPCRouter, protectedProcedure } from '@/integrations/trpc/init'
import { TRPCError } from '@trpc/server'

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
            member: memberProjects.map(p => ({
                ...p.project,
                role: p.member.role,
            })),
        }
    }),

    // get project with loan category from project template
    getDefaultLoanProject: protectedProcedure.query(async ({ ctx }) => {
        // get user id from session
        // get all project template with category loan, return template id
        // from project table , get project with user id and template id
        const userId = ctx.session!.user.id
        const loanTemplate = await db
            .select({ id: projectTemplate.id })
            .from(projectTemplate)
            .where(eq(projectTemplate.category, 'loan'))
            .limit(1)

        const loanProjectData = await db
            .select()
            .from(project)
            .where(
                and(
                    eq(project.userId, userId),
                    eq(project.templateId, loanTemplate[0].id)
                )
            )
            .limit(1)

        if (!loanProjectData.length) {
            return null
        }
        return loanProjectData[0]
    }),

    // Get a single project by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
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

            // Check if user has access to this project
            const isOwner = proj.userId === userId
            const isMember = await db
                .select()
                .from(projectMember)
                .where(
                    and(
                        eq(projectMember.projectId, input.id),
                        eq(projectMember.userId, userId)
                    )
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

    // Create a new project -- done
    create: protectedProcedure
        .input(
            insertProjectSchema.extend({
                invitations: z.array(
                    z.object({
                        email: z.string().email(),
                        name: z.string(),
                    }),
                ).optional(),
            }).omit({ 'userId': true })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session!.user.id

            // Create the project
            const [newProject] = await db
                .insert(project)
                .values({
                    userId,
                    title: input.title,
                    description: input.description,
                    visibility: input.visibility,
                    icon: input.icon,
                    templateId: input.templateId,
                    isCustom: !input.templateId,
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

    // Update a project
    update: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                title: z.string().min(1).max(255).optional(),
                description: z.string().optional(),
                visibility: z.enum(['private', 'shared', 'public']).optional(),
                icon: z.string().optional(),
            })
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
                            eq(projectMember.role, 'admin')
                        )
                    )
                    .limit(1)

                if (!member.length) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to update this project',
                    })
                }
            }

            await db
                .update(project)
                .set({
                    ...updateData,
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
            z.object({
                projectId: z.string().uuid(),
                email: z.string().email(),
                name: z.string().optional(),
            })
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
                            sql`${projectMember.role} IN ('admin', 'owner')`
                        )
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
                        eq(projectInvitation.invitedEmail, input.email),
                        eq(projectInvitation.status, 'pending')
                    )
                )
                .limit(1)

            if (existingInvitation.length) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'An invitation has already been sent to this email',
                })
            }

            // Create invitation
            await db.insert(projectInvitation).values({
                projectId: input.projectId,
                invitedBy: userId,
                invitedEmail: input.email,
                invitedName: input.name,
                status: 'pending',
            })

            // TODO: Send invitation email

            return { success: true }
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
                            eq(projectMember.userId, userId)
                        )
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
                            eq(projectMember.userId, userId)
                        )
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
                .from(projectMember)
                .where(eq(projectMember.projectId, input.projectId))
        }),
})

