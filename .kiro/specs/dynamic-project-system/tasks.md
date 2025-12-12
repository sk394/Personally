# Implementation Plan

- [x] 1. Update database schema for dynamic project types





  - Add `project_type` column to project table with enum constraint
  - Add notification fields to project_invitation table
  - Create database migration script for schema changes
  - Update existing projects with appropriate project types based on associated data
  - _Requirements: 1.3, 5.1, 5.2_

- [x] 2. Update project database models and validation schemas





  - Modify project schema to include projectType field with enum validation
  - Update project insertion and selection schemas with new fields
  - Add validation for project type in Zod schemas
  - Update TypeScript types for Project and ProjectInvitation interfaces
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 3. Create project type selection component





  - Build ProjectTypeSelector component with loan, splitwise, and general options
  - Implement project type option interface with icons and descriptions
  - Add project type selection to project creation form
  - Create unit tests for project type selection component
  - _Requirements: 1.1, 1.2, 6.1, 6.2_

- [x] 4. Implement enhanced project creation API endpoints





  - Update project creation endpoint to handle project type parameter
  - Remove template dependency from project creation logic
  - Add validation for project type in API request handlers

  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [x] 5. Build dashboard notification system for invitations





  - Create InvitationNotification component for displaying pending invitations
  - Implement notification actions (accept, decline, dismiss)
  - Add notification panel to dashboard layout
  - Create API endpoints for fetching and managing invitation notifications
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Implement dynamic routing for project types





  - Create dynamic route handlers for /dashboard/loan/{id} and /dashboard/splitwise/{id}
  - Add project type validation middleware for route access
  - Implement access control to verify project membership
  - Add fallback handling for invalid project IDs or unauthorized access
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
-

- [ ] 7. Update project invitation system for dashboard notifications



  - Modify invitation creation to support dashboard notifications instead of email
  - Update invitation API endpoints to include notification status fields
  - Add notification read/dismiss functionality to invitation management

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

- [ ] 8. Create empty dashboard state for new users
  - Build EmptyDashboard component encouraging project creation
  - Remove default project creation from user signup flow
  - Add quick action buttons for creating different project types
  - Implement conditional rendering based on user's project count
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Update project list interface with type information
  - Modify ProjectListItem component to display project type
  - Add project type icons and visual indicators
  - Update project list API to include project type information
  - Create filtering options by project type
  - _Requirements: 1.4, 6.3_

- [ ] 10. Implement project member invitation workflow
  - Create InviteMember component for adding users to specific projects
  - Update invitation creation to associate with specific project IDs
  - Add member management interface for project owners
  - Create unit tests for member invitation and management
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 11. Add project management actions and navigation
  - Implement project actions (view, edit, invite, leave, delete)
  - Create navigation helpers for dynamic project URLs
  - Add project access validation for all project-specific routes
 
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.2_

- [ ] 12. Create comprehensive integration tests
  - Write end-to-end tests for complete project creation workflow
  - Test invitation acceptance/decline flow from dashboard notifications
  - Verify dynamic routing navigation between different project types
  - Test project member management and access control
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

- [ ] 13. Remove template-based project system
  - Remove projectTemplate references from project creation
  - Clean up unused template-related API endpoints
  - Remove template-based components and logic
  - Update database to make templateId nullable and unused
  - _Requirements: 5.1, 5.2, 6.1, 6.2_