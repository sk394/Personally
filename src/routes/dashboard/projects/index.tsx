import { useState, useMemo } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import PersonallyLogo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ProjectNavigation } from '@/components/project/project-navigation'
import {
  ProjectFilter,
  QuickFilterTabs,
} from '@/components/project/project-filter'
import { CreateNewProjectDialog } from '@/features/project/create-new-project-dialog'
import { useTRPC } from '@/integrations/trpc/react'
import { auth } from '@/lib/auth/auth'

type ProjectType = 'loan' | 'splitwise' | 'general'

const authStateFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) {
    throw redirect({
      to: '/signin',
    })
  }
  return { userId: session.user?.id }
})

export const Route = createFileRoute('/dashboard/projects/')({
  component: RouteComponent,
  beforeLoad: async () => await authStateFn(),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.project.getAll.queryOptions(),
    )
    return { userId: context.userId }
  },
})

function RouteComponent() {
  const trpc = useTRPC()
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<ProjectType[]>([
    'loan',
    'splitwise',
    'general',
  ])
  const [quickFilterType, setQuickFilterType] = useState<
    ProjectType | 'all'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: projectsData, isLoading } = useQuery(
    trpc.project.getAll.queryOptions(),
  )

  // Combine owned and member projects
  const allProjects = useMemo(() => {
    if (!projectsData) return []
    return [
      ...projectsData.owned.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || undefined,
        projectType: p.projectType,
        userRole: 'owner' as const,
        memberCount: 1,
        updatedAt: p.updated_at || undefined,
      })),
      ...projectsData.member.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || undefined,
        projectType: p.projectType,
        userRole: p.role as 'owner' | 'admin' | 'member',
        memberCount: 1,
        updatedAt: p.updated_at || undefined,
      })),
    ]
  }, [projectsData])

  // Calculate project counts
  const projectCounts = useMemo(() => {
    const counts = {
      loan: 0,
      splitwise: 0,
      general: 0,
      all: allProjects.length,
    }
    allProjects.forEach((project) => {
      counts[project.projectType]++
    })
    return counts
  }, [allProjects])

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = allProjects

    // Apply quick filter
    if (quickFilterType !== 'all') {
      filtered = filtered.filter((p) => p.projectType === quickFilterType)
    } else {
      // Apply multi-select filter only when not using quick filter
      if (selectedTypes.length > 0 && selectedTypes.length < 3) {
        filtered = filtered.filter((p) => selectedTypes.includes(p.projectType))
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [allProjects, selectedTypes, quickFilterType, searchQuery])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 sm:py-10">
        <div className="w-full max-w-2xl items-center justify-center flex">
          <PersonallyLogo width="350" height="40" />
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/50" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Title and Actions */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize all your projects
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setIsProjectDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="size-5" />
            New Project
          </Button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="mb-6">
          <QuickFilterTabs
            selectedType={quickFilterType}
            onTypeChange={setQuickFilterType}
            projectCounts={projectCounts}
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ProjectFilter
            selectedTypes={selectedTypes}
            onFilterChange={setSelectedTypes}
            projectCounts={projectCounts}
          />
        </div>

        {/* Results Summary */}
        {(searchQuery || quickFilterType !== 'all' || selectedTypes.length < 3) && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {allProjects.length} projects
            {searchQuery && (
              <Button
                variant="link"
                size="sm"
                className="ml-2 h-auto p-0"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Project Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'No projects match your search'
                : allProjects.length === 0
                  ? 'No projects yet'
                  : 'No projects match your filters'}
            </p>
            {allProjects.length === 0 && (
              <Button onClick={() => setIsProjectDialogOpen(true)}>
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <ProjectNavigation projects={filteredProjects} />
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateNewProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
      />
    </div>
  )
}
