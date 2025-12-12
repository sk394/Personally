import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { validateProjectAccess, handleProjectAccessError } from '@/lib/project-access'
import { getProjectUrl, validateProjectTypeForUrl } from '@/lib/project-navigation'

describe('Dynamic Project Routing', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  describe('Project Access Validation', () => {
    it('should validate loan project access for owner', () => {
      const project = {
        id: 'project-1',
        title: 'My Loan Project',
        projectType: 'loan' as const,
        userId: 'user-1',
        visibility: 'private' as const,
        members: [],
      }

      const result = validateProjectAccess(project, 'user-1', 'loan')

      expect(result.hasAccess).toBe(true)
      expect(result.project.isOwner).toBe(true)
      expect(result.project.projectType).toBe('loan')
    })

    it('should validate splitwise project access for member', () => {
      const project = {
        id: 'project-2',
        title: 'Shared Expenses',
        projectType: 'splitwise' as const,
        userId: 'user-1',
        visibility: 'private' as const,
        members: [{ userId: 'user-2', role: 'member' }],
      }

      const result = validateProjectAccess(project, 'user-2', 'splitwise')

      expect(result.hasAccess).toBe(true)
      expect(result.project.isOwner).toBe(false)
      expect(result.project.projectType).toBe('splitwise')
    })

    it('should reject access for wrong project type', () => {
      const project = {
        id: 'project-3',
        title: 'Splitwise Project',
        projectType: 'splitwise' as const,
        userId: 'user-1',
        visibility: 'private' as const,
        members: [],
      }

      expect(() => {
        validateProjectAccess(project, 'user-1', 'loan')
      }).toThrow('Project type mismatch')
    })

    it('should reject access for non-member of private project', () => {
      const project = {
        id: 'project-4',
        title: 'Private Project',
        projectType: 'loan' as const,
        userId: 'user-1',
        visibility: 'private' as const,
        members: [],
      }

      expect(() => {
        validateProjectAccess(project, 'user-2', 'loan')
      }).toThrow('You do not have access to this project')
    })
  })

  describe('Project Navigation', () => {
    it('should generate correct loan project URL', () => {
      const project = {
        id: 'loan-project-1',
        title: 'My Loan',
        projectType: 'loan' as const,
      }

      const url = getProjectUrl(project)
      expect(url).toBe('/dashboard/loan/loan-project-1')
    })

    it('should generate correct splitwise project URL', () => {
      const project = {
        id: 'splitwise-project-1',
        title: 'Shared Expenses',
        projectType: 'splitwise' as const,
      }

      const url = getProjectUrl(project)
      expect(url).toBe('/dashboard/splitwise/splitwise-project-1')
    })

    it('should validate project type for URL pattern', () => {
      expect(validateProjectTypeForUrl('loan', '/dashboard/loan/123')).toBe(true)
      expect(validateProjectTypeForUrl('splitwise', '/dashboard/loan/123')).toBe(false)
      expect(validateProjectTypeForUrl('splitwise', '/dashboard/splitwise/123')).toBe(true)
      expect(validateProjectTypeForUrl('loan', '/dashboard/splitwise/123')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle not found errors', () => {
      const error = new Error('Project not found')
      const result = handleProjectAccessError(error)

      expect(result.type).toBe('not-found')
      expect(result.message).toBe('Project not found')
    })

    it('should handle access denied errors', () => {
      const error = new Error('You do not have access to this project')
      const result = handleProjectAccessError(error)

      expect(result.type).toBe('forbidden')
      expect(result.message).toBe('You do not have access to this project')
    })

    it('should handle type mismatch errors', () => {
      const error = new Error('Project type mismatch. Expected loan, got splitwise')
      const result = handleProjectAccessError(error)

      expect(result.type).toBe('type-mismatch')
      expect(result.message).toBe('Invalid project type for this URL')
    })
  })
})