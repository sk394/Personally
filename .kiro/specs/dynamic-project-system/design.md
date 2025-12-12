# Design Document

## Overview

This design transforms the current project system from a template-based approach to a user-driven dynamic project creation system. The new system eliminates default project templates created during user signup and implements a flexible project type selection with proper invitation management through dashboard notifications.

## Architecture

### Current System Analysis

The existing system uses:

- `projectTemplate` table with default templates created for new users
- `project` table linked to templates via `templateId`
- `projectInvitation` table for email-based invitations
- Separate feature modules for loan and splitwise functionality

### New System Architecture

The redesigned system will:

- Remove dependency on `projectTemplate` for user projects
- Add `projectType` field directly to `project` table
- Enhance dashboard to show invitation notifications
- Implement dynamic routing based on project type
- Maintain existing loan and splitwise functionality within projects

## Components and Interfaces

### 1. Database Schema Changes

#### Modified Project Table

```sql
-- Add project type directly to project table
ALTER TABLE project ADD COLUMN project_type VARCHAR(50) NOT NULL DEFAULT 'general';
-- Remove template dependency (make templateId nullable and unused)
-- Keep existing fields: id, userId, title, description, icon, visibility, maxMembers
```

#### Enhanced Project Invitation System

```sql
-- Modify existing projectInvitation table to support dashboard notifications
-- Add notification fields for better UX
ALTER TABLE project_invitation ADD COLUMN notification_read BOOLEAN DEFAULT FALSE;
ALTER TABLE project_invitation ADD COLUMN notification_dismissed BOOLEAN DEFAULT FALSE;
```

### 2. Project Creation Interface

#### Project Type Selection Component

```typescript
interface ProjectTypeOption {
  type: 'loan' | 'splitwise' | 'general'
  name: string
  description: string
  icon: string
}

interface CreateProjectForm {
  title: string
  description?: string
  projectType: ProjectTypeOption['type']
  visibility: 'private' | 'public'
}
```

#### Project Creation Flow

1. User clicks "Create Project"
2. Modal/page shows project type selection
3. User selects type (loan, splitwise, etc.)
4. User fills project details
5. System creates project with selected type
6. User redirected to project-specific interface

### 3. Dashboard Notification System

#### Invitation Notification Component

```typescript
interface InvitationNotification {
  id: string
  projectId: string
  projectName: string
  projectType: 'loan' | 'splitwise' | 'general'
  inviterName: string
  invitedAt: Date
  expiresAt: Date
}

interface NotificationActions {
  accept: (invitationId: string) => Promise<void>
  decline: (invitationId: string) => Promise<void>
  dismiss: (invitationId: string) => Promise<void>
}
```

#### Dashboard Layout

- Notification panel at top of dashboard
- Project grid showing user's actual projects
- Empty state for new users encouraging project creation
- Quick actions for creating different project types

### 4. Dynamic Routing System

#### Route Structure

```
/dashboard/loan/{projectId}     - Loan project interface
/dashboard/splitwise/{projectId} - Splitwise project interface
/dashboard/general/{projectId}   - General project interface (future)
```

#### Route Components

- Dynamic route handlers based on project type
- Project type validation middleware
- Access control for project membership
- Fallback for invalid project IDs or unauthorized access

### 5. Project Management Interface

#### Project List Component

```typescript
interface ProjectListItem {
  id: string
  title: string
  projectType: 'loan' | 'splitwise' | 'general'
  memberCount: number
  lastActivity: Date
  role: 'owner' | 'admin' | 'member'
}
```

#### Project Actions

- View project (navigate to dynamic URL)
- Edit project details (owners/admins only)
- Invite members
- Leave project (non-owners)
- Delete project (owners only)

## Data Models

### Updated Project Model

```typescript
interface Project {
  id: string
  userId: string // owner
  title: string
  description?: string
  projectType: 'loan' | 'splitwise' | 'general'
  icon?: string
  visibility: 'private' | 'public'
  maxMembers: number
  createdAt: Date
  updatedAt: Date
}
```

### Invitation Model (Enhanced)

```typescript
interface ProjectInvitation {
  id: string
  projectId: string
  invitedBy: string
  invitedUserId?: string // for existing users
  invitedEmail: string
  invitedName?: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  notificationRead: boolean
  notificationDismissed: boolean
  invitedAt: Date
  respondedAt?: Date
  expiresAt: Date
}
```

### Project Member Model (Unchanged)

```typescript
interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
  addedBy?: string
}
```

## Error Handling

### Project Access Errors

- **Unauthorized Access**: Redirect to dashboard with error message
- **Project Not Found**: Show 404 page with navigation back to dashboard
- **Invalid Project Type**: Fallback to general project view or error page

### Invitation Errors

- **Expired Invitations**: Auto-cleanup and user notification
- **Duplicate Invitations**: Prevent sending, show existing invitation status
- **Invalid Email**: Validation on frontend and backend

### Project Creation Errors

- **Duplicate Names**: Allow duplicates but warn user
- **Invalid Project Type**: Fallback to 'general' type
- **Database Errors**: Show user-friendly error with retry option

## Testing Strategy

### Unit Tests

- Project creation with different types
- Invitation creation and management
- Dashboard notification rendering
- Route parameter validation
- Access control logic

### Integration Tests

- End-to-end project creation flow
- Invitation acceptance/decline flow
- Dynamic routing navigation
- Dashboard notification interactions
- Project member management

### User Acceptance Tests

- New user onboarding (empty dashboard)
- Project creation for different types
- Invitation workflow from sender and receiver perspective
- Navigation between different project types
- Project management operations

### Performance Tests

- Dashboard loading with multiple projects
- Notification polling/real-time updates
- Project list pagination
- Database query optimization for project access

## Migration Strategy

### Phase 1: Database Schema Updates

1. Add `project_type` column to existing projects
2. Update existing projects to have appropriate types based on associated data
3. Add notification fields to invitation table
4. Create database indexes for performance

### Phase 2: Backend API Updates

1. Update project creation endpoints
2. Modify invitation endpoints for dashboard notifications
3. Add project type validation
4. Update project listing with type information

### Phase 3: Frontend Implementation

1. Create new project creation interface
2. Implement dashboard notifications
3. Update routing for dynamic project URLs
4. Remove template-based project creation

### Phase 4: Cleanup

1. Remove unused template-related code
2. Update documentation
3. Remove default project creation from signup flow
4. Archive old template data

## Security Considerations

### Access Control

- Verify project membership before allowing access
- Validate project type matches URL pattern
- Ensure invitation permissions (only members can invite)
- Rate limiting on invitation creation

### Data Validation

- Sanitize project names and descriptions
- Validate email addresses for invitations
- Ensure project type is from allowed enum
- Validate project member limits

### Privacy

- Respect project visibility settings
- Don't expose private project details in invitations
- Secure project member information
- Audit trail for project access and modifications
