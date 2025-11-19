import { db } from '@/lib/db'
import { project, projectMember, projectTemplate } from '@/lib/db/schema/project'
import { eq, and } from 'drizzle-orm'

export async function createDefaultProjectsForUser(userId: string) {
    try {
        // Get all default project templates
        const templates = await db
            .select()
            .from(projectTemplate)
            .where(eq(projectTemplate.isDefault, true))

        if (templates.length === 0) {
            return { success: false, message: 'No templates found' }
        }

        const createdProjects = []

        // Create a project for each template
        for (const template of templates) {
            // Check if user already has a project from this template
            const existingProject = await db
                .select()
                .from(project)
                .where(
                    and(
                        eq(project.userId, userId),
                        eq(project.templateId, template.id)
                    )
                )
                .limit(1)

            if (existingProject.length > 0) {
                console.log(` User already has "${template.name}" project, skipping...`)
                continue
            }

            // Create the project
            const [newProject] = await db
                .insert(project)
                .values({
                    userId,
                    templateId: template.id,
                    title: template.name,
                    description: template.description || undefined,
                    icon: template.icon || undefined,
                    visibility: 'private',
                    isCustom: false,
                })
                .returning()

            // Add the user as the owner member
            await db.insert(projectMember).values({
                projectId: newProject.id,
                userId,
                role: 'owner',
                addedBy: userId,
            })

            createdProjects.push(newProject)
            console.log(`Created project: "${template.name}" (${newProject.id})`)
        }

        return {
            success: true,
            projects: createdProjects,
        }
    } catch (error) {
        console.error('Error creating default projects for user:', error)
        throw error
    }
}

/**
 * Get a specific project by template category for a user
 * Uses Drizzle ORM relations for cleaner queries
 */
export async function getUserProjectByCategory(userId: string, category: string) {
    // Query using relations - get the project template and its associated user projects
    const result = await db.query.projectTemplate.findFirst({
        where: (template, { eq }) => eq(template.category, category),
        with: {
            projects: {
                where: (proj, { eq, and }) =>
                    and(
                        eq(proj.userId, userId),
                        eq(proj.isCustom, false)
                    )
            }
        }
    })

    if (!result || !result.projects || result.projects.length === 0) {
        return null
    }

    return result.projects[0]
}

/**
 * Get project ID for a specific category/template
 * Returns only the project ID for efficiency
 */
export async function getUserProjectIdByCategory(userId: string, category: string): Promise<string | null> {
    const project = await getUserProjectByCategory(userId, category)
    return project?.id || null
}
