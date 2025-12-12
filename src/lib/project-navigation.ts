/**
 * Navigation helpers for dynamic project URLs
 */

export interface ProjectNavigationItem {
  id: string
  title: string
  projectType: 'loan' | 'splitwise' | 'general'
}

/**
 * Generate the correct URL for a project based on its type
 */
export function getProjectUrl(project: ProjectNavigationItem): string {
  switch (project.projectType) {
    case 'loan':
      return `/dashboard/loan/${project.id}`
    case 'splitwise':
      return `/dashboard/splitwise/${project.id}`
    case 'general':
      return `/dashboard/general/${project.id}`
    default:
      return `/dashboard`
  }
}

/**
 * Get the display name for a project type
 */
export function getProjectTypeDisplayName(projectType: 'loan' | 'splitwise' | 'general'): string {
  switch (projectType) {
    case 'loan':
      return 'Loan'
    case 'splitwise':
      return 'Splitwise'
    case 'general':
      return 'General'
    default:
      return 'Project'
  }
}

/**
 * Get the icon for a project type
 */
export function getProjectTypeIcon(projectType: 'loan' | 'splitwise' | 'general'): string {
  switch (projectType) {
    case 'loan':
      return 'DollarSign'
    case 'splitwise':
      return 'Users'
    case 'general':
      return 'Folder'
    default:
      return 'Folder'
  }
}

/**
 * Validate if a project type is valid for a given URL pattern
 */
export function validateProjectTypeForUrl(
  projectType: 'loan' | 'splitwise' | 'general',
  urlPattern: string
): boolean {
  if (urlPattern.includes('/loan/') && projectType !== 'loan') {
    return false
  }
  if (urlPattern.includes('/splitwise/') && projectType !== 'splitwise') {
    return false
  }
  if (urlPattern.includes('/general/') && projectType !== 'general') {
    return false
  }
  return true
}