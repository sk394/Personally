# Requirements Document

## Introduction

This feature redesigns the current project system to eliminate default project templates and implement a user-driven project creation system. Users will be able to create projects of different types (loan, splitwise, etc.) and invite members to specific projects. The system will include a dashboard notification system for project invitations without email dependencies.

## Requirements

### Requirement 1

**User Story:** As a user, I want to create projects of different types (loan, splitwise, etc.) so that I can organize my financial activities appropriately.

#### Acceptance Criteria

1. WHEN a user accesses project creation THEN the system SHALL display available project types (loan, splitwise)
2. WHEN a user selects a project type THEN the system SHALL create a new project with the specified type
3. WHEN a project is created THEN the system SHALL generate a unique project ID for that specific project
4. IF a user creates multiple projects THEN each project SHALL have its own unique identifier and type

### Requirement 2

**User Story:** As a user, I want to invite other users to my projects so that we can collaborate on shared financial activities like splitting expenses.

#### Acceptance Criteria

1. WHEN a user creates or owns a project THEN the system SHALL provide an option to invite other users
2. WHEN a user sends an invitation THEN the system SHALL create a notification for the invited user
3. WHEN an invitation is sent THEN the system SHALL associate the invitation with the specific project ID
4. IF a user accepts an invitation THEN the system SHALL add them as a member to that specific project

### Requirement 3

**User Story:** As a user, I want to see project invitations on my dashboard so that I can accept or decline collaboration requests without needing email.

#### Acceptance Criteria

1. WHEN a user has pending invitations THEN the dashboard SHALL display all pending project invitations
2. WHEN a user views an invitation THEN the system SHALL show the project name, type, and inviting user
3. WHEN a user accepts an invitation THEN the system SHALL add them to the project and remove the invitation
4. WHEN a user declines an invitation THEN the system SHALL remove the invitation without adding them to the project

### Requirement 4

**User Story:** As a user, I want to access my projects through dynamic URLs so that I can directly navigate to specific loan or splitwise projects.

#### Acceptance Criteria

1. WHEN a user accesses a loan project THEN the URL SHALL follow the pattern /dashboard/loan/{project_id}
2. WHEN a user accesses a splitwise project THEN the URL SHALL follow the pattern /dashboard/splitwise/{project_id}
3. WHEN a user navigates to a project URL THEN the system SHALL display the appropriate interface for that project type
4. IF a user doesn't have access to a project THEN the system SHALL redirect them or show an access denied message

### Requirement 5

**User Story:** As a new user, I want to start with an empty dashboard so that I can create projects based on my actual needs rather than having default templates.

#### Acceptance Criteria

1. WHEN a new user signs up THEN the system SHALL NOT create any default projects
2. WHEN a new user accesses their dashboard THEN the system SHALL show an empty state with project creation options
3. WHEN a user has no projects THEN the dashboard SHALL encourage them to create their first project
4. IF a user has existing projects THEN the dashboard SHALL display only their actual projects

### Requirement 6

**User Story:** As a user, I want the system to be simple and straightforward so that I can focus on managing my finances without complexity.

#### Acceptance Criteria

1. WHEN a user interacts with the project system THEN all workflows SHALL be intuitive and require minimal steps
2. WHEN a user creates a project THEN the process SHALL be completed in a single form submission
3. WHEN a user manages invitations THEN the interface SHALL clearly show all available actions
4. IF the system encounters an error THEN error messages SHALL be clear and actionable
