import { render, screen, fireEvent } from '@testing-library/react'
import { InvitationNotification, InvitationNotificationData } from '../invitation-notification'

const mockInvitation: InvitationNotificationData = {
  id: '1',
  projectId: 'project-1',
  projectName: 'Test Project',
  projectType: 'loan',
  inviterName: 'John Doe',
  invitedAt: new Date('2024-01-01'),
  expiresAt: new Date('2024-01-08'),
  notificationRead: false,
  notificationDismissed: false,
}

const mockHandlers = {
  onAccept: vi.fn(),
  onDecline: vi.fn(),
  onDismiss: vi.fn(),
  onMarkRead: vi.fn(),
}

describe('InvitationNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders invitation details correctly', () => {
    render(<InvitationNotification invitation={mockInvitation} {...mockHandlers} />)
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText(/John Doe invited you to join/)).toBeInTheDocument()
    expect(screen.getByText('Loan')).toBeInTheDocument()
  })

  it('calls onAccept when accept button is clicked', () => {
    render(<InvitationNotification invitation={mockInvitation} {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Accept'))
    expect(mockHandlers.onAccept).toHaveBeenCalledWith('1')
  })

  it('calls onDecline when decline button is clicked', () => {
    render(<InvitationNotification invitation={mockInvitation} {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Decline'))
    expect(mockHandlers.onDecline).toHaveBeenCalledWith('1')
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<InvitationNotification invitation={mockInvitation} {...mockHandlers} />)
    
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(mockHandlers.onDismiss).toHaveBeenCalledWith('1')
  })

  it('shows unread indicator for unread notifications', () => {
    render(<InvitationNotification invitation={mockInvitation} {...mockHandlers} />)
    
    expect(screen.getByRole('generic', { hidden: true })).toHaveClass('bg-blue-500')
  })

  it('does not show unread indicator for read notifications', () => {
    const readInvitation = { ...mockInvitation, notificationRead: true }
    render(<InvitationNotification invitation={readInvitation} {...mockHandlers} />)
    
    expect(screen.queryByRole('generic', { hidden: true })).not.toBeInTheDocument()
  })

  it('marks notification as read when card is clicked', () => {
    const { container } = render(<InvitationNotification invitation={mockInvitation} {...mockHandlers} />)
    
    // Click on the card
    fireEvent.click(container.firstChild as Element)
    
    expect(mockHandlers.onMarkRead).toHaveBeenCalledWith('1')
  })

  it('does not mark as read if already read', () => {
    const readInvitation = { ...mockInvitation, notificationRead: true }
    const { container } = render(<InvitationNotification invitation={readInvitation} {...mockHandlers} />)
    
    // Click on the card
    fireEvent.click(container.firstChild as Element)
    
    expect(mockHandlers.onMarkRead).not.toHaveBeenCalled()
  })
})