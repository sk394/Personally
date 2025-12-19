import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ExternalLink,
    Settings,
    UserPlus,
    LogOut,
    Trash2,
    MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { InviteMemberComponent } from './invite-member'
import { useTRPC } from '@/integrations/trpc/react'
import { getProjectUrl } from '@/lib/project-navigation'

interface ProjectActionsProps {
    project: {
        id: string
        title: string
        projectType: 'loan' | 'splitwise' | 'general'
        userRole?: 'owner' | 'admin' | 'member' | 'viewer'
    }
    compact?: boolean
}

export function ProjectActions({ project, compact = false }: ProjectActionsProps) {
    const navigate = useNavigate()
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

    const isOwner = project.userRole === 'owner'
    const canInvite = isOwner || project.userRole === 'admin'
    const canDelete = isOwner
    const canLeave = !isOwner

    const deleteProjectMutation = useMutation(
        trpc.project.delete.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['project', 'getAll']],
                })
                toast.success('Project deleted successfully')
                setDeleteDialogOpen(false)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to delete project')
            },
        }),
    )

    const leaveProjectMutation = useMutation(
        trpc.project.leave.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [['project', 'getAll']],
                })
                toast.success('Left project successfully')
                setLeaveDialogOpen(false)
            },
            onError: (error: any) => {
                toast.error(error.message || 'Failed to leave project')
            },
        }),
    )

    const handleViewProject = () => {
        const url = getProjectUrl(project)
        navigate({ to: url })
    }

    if (compact) {
        return (
            <>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1">
                        <div className="flex flex-col gap-1">
                            <Button
                                variant="ghost"
                                className="justify-start gap-2"
                                onClick={handleViewProject}
                            >
                                <ExternalLink className="size-4" />
                                Open Project
                            </Button>
                            {canInvite && (
                                <Button
                                    variant="ghost"
                                    className="justify-start gap-2"
                                    onClick={() => setInviteDialogOpen(true)}
                                >
                                    <UserPlus className="size-4" />
                                    Invite Members
                                </Button>
                            )}
                            {isOwner && (
                                <Button variant="ghost" className="justify-start gap-2">
                                    <Settings className="size-4" />
                                    Settings
                                </Button>
                            )}
                            {(canLeave || canDelete) && (
                                <div className="h-px bg-border my-1" />
                            )}
                            {canLeave && (
                                <Button
                                    variant="ghost"
                                    className="justify-start gap-2 text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                                    onClick={() => setLeaveDialogOpen(true)}
                                >
                                    <LogOut className="size-4" />
                                    Leave Project
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="size-4" />
                                    Delete Project
                                </Button>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <InviteMemberComponent
                    projectId={project.id}
                    projectTitle={project.title}
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                />

                <DeleteProjectDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    projectTitle={project.title}
                    onConfirm={() => deleteProjectMutation.mutate({ id: project.id })}
                    isDeleting={deleteProjectMutation.isPending}
                />

                <LeaveProjectDialog
                    open={leaveDialogOpen}
                    onOpenChange={setLeaveDialogOpen}
                    projectTitle={project.title}
                    onConfirm={() => leaveProjectMutation.mutate({ projectId: project.id })}
                    isLeaving={leaveProjectMutation.isPending}
                />
            </>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button onClick={handleViewProject} className="gap-2">
                <ExternalLink className="size-4" />
                Open Project
            </Button>
            {canInvite && (
                <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(true)}
                    className="gap-2"
                >
                    <UserPlus className="size-4" />
                    Invite
                </Button>
            )}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                        <MoreVertical className="size-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                    <div className="flex flex-col gap-1">
                        {isOwner && (
                            <Button variant="ghost" className="justify-start gap-2">
                                <Settings className="size-4" />
                                Settings
                            </Button>
                        )}
                        {(canLeave || canDelete) && (
                            <div className="h-px bg-border my-1" />
                        )}
                        {canLeave && (
                            <Button
                                variant="ghost"
                                className="justify-start gap-2 text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                                onClick={() => setLeaveDialogOpen(true)}
                            >
                                <LogOut className="size-4" />
                                Leave Project
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Delete Project
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <InviteMemberComponent
                projectId={project.id}
                projectTitle={project.title}
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
            />

            <DeleteProjectDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                projectTitle={project.title}
                onConfirm={() => deleteProjectMutation.mutate({ id: project.id })}
                isDeleting={deleteProjectMutation.isPending}
            />

            <LeaveProjectDialog
                open={leaveDialogOpen}
                onOpenChange={setLeaveDialogOpen}
                projectTitle={project.title}
                onConfirm={() => leaveProjectMutation.mutate({ projectId: project.id })}
                isLeaving={leaveProjectMutation.isPending}
            />
        </div>
    )
}

interface DeleteProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectTitle: string
    onConfirm: () => void
    isDeleting: boolean
}

function DeleteProjectDialog({
    open,
    onOpenChange,
    projectTitle,
    onConfirm,
    isDeleting,
}: DeleteProjectDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete project?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{projectTitle}"? This action cannot
                        be undone. All project data, including members and related content,
                        will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

interface LeaveProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectTitle: string
    onConfirm: () => void
    isLeaving: boolean
}

function LeaveProjectDialog({
    open,
    onOpenChange,
    projectTitle,
    onConfirm,
    isLeaving,
}: LeaveProjectDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave project?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to leave "{projectTitle}"? You'll need to be
                        re-invited to access this project again.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLeaving}
                        className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                        {isLeaving ? 'Leaving...' : 'Leave Project'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
