import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { project, projectInvitation, user } from '@/lib/db/schema/project'
import { projectRouter } from '../project'

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      projectMember: {
        findMany: vi.fn(),
      },
    },
  },
}))

const mockDb = db as any

describe('Project Invitation API', () => {
  const mockUserId = 'user-123'
  const mockProjectId = 'project-456'
  const mockInvitationId = 'invitation-789'
  const mockEmail = 'test@example.com'

  const mockContext = {
    session: {
      user: { id: mockUserId },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('inviteUser', () => {
    it('should create invitation with user ID for existing users', async () => {
      // Mock existing user lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 'existing-user-id', email: mockEmail }
            ])
          })
        })
      })

      // Mock project ownership check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockProjectId, userId: mockUserId }
            ])
          })
        })
      })

      // Mock existing invitation check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })

      // Mock user lookup for invitation creation
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 'existing-user-id', email: mockEmail }
            ])
          })
        })
      })

      // Mock invitation creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      })

      const caller = projectRouter.createCaller(mockContext)
      
      const result = await caller.inviteUser({
        projectId: mockProjectId,
        invitedEmail: mockEmail,
        invitedName: 'Test User'
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('dashboard')
      expect(mockDb.insert).toHaveBeenCalledWith(projectInvitation)
    })

    it('should create invitation without user ID for non-existing users', async () => {
      // Mock project ownership check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockProjectId, userId: mockUserId }
            ])
          })
        })
      })

      // Mock existing invitation check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })

      // Mock user lookup (no existing user)
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })

      // Mock invitation creation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      })

      const caller = projectRouter.createCaller(mockContext)
      
      const result = await caller.inviteUser({
        projectId: mockProjectId,
        invitedEmail: mockEmail,
        invitedName: 'Test User'
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('sign up')
    })
  })

  describe('markNotificationRead', () => {
    it('should mark notification as read for authorized user', async () => {
      // Mock invitation lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockInvitationId,
                invitedUserId: mockUserId,
                invitedEmail: mockEmail,
                status: 'pending'
              }
            ])
          })
        })
      })

      // Mock current user lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockUserId, email: mockEmail }
            ])
          })
        })
      })

      // Mock update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      })

      const caller = projectRouter.createCaller(mockContext)
      
      const result = await caller.markNotificationRead({
        invitationId: mockInvitationId
      })

      expect(result.success).toBe(true)
      expect(mockDb.update).toHaveBeenCalledWith(projectInvitation)
    })

    it('should throw error for unauthorized user', async () => {
      // Mock invitation lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockInvitationId,
                invitedUserId: 'different-user',
                invitedEmail: 'different@email.com',
                status: 'pending'
              }
            ])
          })
        })
      })

      // Mock current user lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockUserId, email: mockEmail }
            ])
          })
        })
      })

      const caller = projectRouter.createCaller(mockContext)
      
      await expect(caller.markNotificationRead({
        invitationId: mockInvitationId
      })).rejects.toThrow(TRPCError)
    })
  })

  describe('dismissNotification', () => {
    it('should dismiss notification with proper flags', async () => {
      // Mock invitation lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: mockInvitationId,
                invitedUserId: mockUserId,
                invitedEmail: mockEmail,
                status: 'pending'
              }
            ])
          })
        })
      })

      // Mock current user lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockUserId, email: mockEmail }
            ])
          })
        })
      })

      // Mock update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      })

      const caller = projectRouter.createCaller(mockContext)
      
      const result = await caller.dismissNotification({
        invitationId: mockInvitationId,
        markAsRead: true,
        dismiss: true
      })

      expect(result.success).toBe(true)
      expect(mockDb.update).toHaveBeenCalledWith(projectInvitation)
    })
  })

  describe('getPendingInvitations', () => {
    it('should return formatted invitations for dashboard notifications', async () => {
      const mockInvitations = [
        {
          invitation: {
            id: mockInvitationId,
            invitedAt: new Date(),
            expiresAt: new Date(),
            notificationRead: false,
            notificationDismissed: false
          },
          project: {
            id: mockProjectId,
            title: 'Test Project',
            projectType: 'loan'
          },
          inviter: {
            name: 'John Doe'
          }
        }
      ]

      // Mock user invitations query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockInvitations)
            })
          })
        })
      })

      // Mock current user lookup
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: mockUserId, email: mockEmail }
            ])
          })
        })
      })

      // Mock email invitations query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([])
            })
          })
        })
      })

      const caller = projectRouter.createCaller(mockContext)
      
      const result = await caller.getPendingInvitations()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: mockInvitationId,
        projectId: mockProjectId,
        projectName: 'Test Project',
        projectType: 'loan',
        inviterName: 'John Doe',
        notificationRead: false,
        notificationDismissed: false
      })
    })
  })
})