import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, Folder, ExternalLink } from 'lucide-react'
import { getProjectUrl, getProjectTypeDisplayName } from '@/lib/project-navigation'
import { ProjectActions } from './project-actions'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'

interface ProjectNavigationProps {
  projects: Array<{
    id: string
    title: string
    description?: string
    projectType: 'loan' | 'splitwise' | 'general'
    memberCount?: number
    userRole?: 'owner' | 'admin' | 'member'
    updatedAt?: Date
  }>
  className?: string
}

export function ProjectNavigation({ projects, className }: ProjectNavigationProps) {
  if (projects.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No projects found</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description?: string
    projectType: 'loan' | 'splitwise' | 'general'
    memberCount?: number
    userRole?: 'owner' | 'admin' | 'member'
    updatedAt?: Date
  }
}

function ProjectCard({ project }: ProjectCardProps) {
  const projectUrl = getProjectUrl(project)
  const typeDisplayName = getProjectTypeDisplayName(project.projectType)

  const trpc = useTRPC()

  const { data: memberCount } = useQuery(trpc.project.getMemberCount.queryOptions({
    projectId: project.id,
  }))

  const getProjectIcon = () => {
    switch (project.projectType) {
      case 'loan':
        return <DollarSign className="size-5" />
      case 'splitwise':
        return <Users className="size-5" />
      case 'general':
        return <Folder className="size-5" />
      default:
        return <Folder className="size-5" />
    }
  }

  const getProjectColor = () => {
    switch (project.projectType) {
      case 'loan':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'splitwise':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'general':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader className="pb-3 py-2">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getProjectColor()}`}>
              {getProjectIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{project.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {typeDisplayName}
                </Badge>
                {project.userRole && (
                  <Badge
                    variant={project.userRole === 'owner' ? 'primary' : 'outline'}
                    className="text-xs"
                  >
                    {project.userRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex">
            <ProjectActions project={project} compact />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {project.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {memberCount ? `${memberCount} members` : 'Solo project'}
          </span>
          {project.updatedAt && (
            <span>
              Updated {project.updatedAt.toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="mt-3">
          <Link to={projectUrl}>
            <Button className="w-full" size="sm">
              Open Project
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export { ProjectCard }