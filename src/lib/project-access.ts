import type { Session } from 'better-auth/types'

export interface ProjectAccessValidationOptions {
  projectId: string
  expectedType?: 'loan' | 'splitwise' | 'general'
  session: Session
}

export interface ProjectAccessResult {
  project: {
    id: string
    title: string
    description?: string
    projectType: 'loan' | 'splitwise' | 'general'
    userId: string
    isOwner: boolean
  }
  hasAccess: boolean
}

/**
 * Validates project access and type for dynamic routes
 * This is a client-side validation that works with TRPC queries
 */
export function validateProjectAccess(
  project: any,
  userId: string,
  expectedType?: 'loan' | 'splitwise' | 'general'
): ProjectAccessResult {
  if (!project) {
    throw new Error('Project not found')
  }

  // Validate project type if expected type is provided
  if (expectedType && project.projectType !== expectedType) {
    throw new Error(`Project type mismatch. Expected ${expectedType}, got ${project.projectType}`)
  }

  // Check if user has access (owner or member)
  const isOwner = project.userId === userId
  const hasAccess = isOwner || project.members?.some((member: any) => member.userId === userId)

  if (!hasAccess && project.visibility === 'private') {
    throw new Error('You do not have access to this project')
  }

  return {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      projectType: project.projectType,
      userId: project.userId,
      isOwner,
    },
    hasAccess,
  }
}

/**
 * Error handler for project access errors
 */
export function handleProjectAccessError(error: any) {
  if (error.message?.includes('not found')) {
    return {
      type: 'not-found' as const,
      message: 'Project not found',
    }
  }

  if (error.message?.includes('access')) {
    return {
      type: 'forbidden' as const,
      message: 'You do not have access to this project',
    }
  }

  if (error.message?.includes('type mismatch')) {
    return {
      type: 'type-mismatch' as const,
      message: 'Invalid project type for this URL',
    }
  }

  return {
    type: 'unknown' as const,
    message: error.message || 'An error occurred',
  }
}