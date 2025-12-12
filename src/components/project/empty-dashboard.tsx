import { useNavigate } from '@tanstack/react-router'
import {
    BellRing,
    ClipboardList,
    Flag,
    Folder,
    Rocket,
    StickyNote,
    Trophy,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PersonallyLogo from '@/components/logo'
import { CreateNewProjectDialog } from '@/features/project/create-new-project-dialog'

interface QuickActionButton {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    onClick: () => void
    color: string
}

export function EmptyDashboard() {
    const navigate = useNavigate()
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

    const quickActions: QuickActionButton[] = [
        {
            id: 'project',
            name: 'Create Project',
            description: 'Organize tasks and collaborate',
            icon: <Folder className="w-6 h-6" />,
            onClick: () => setIsProjectDialogOpen(true),
            color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
        },
        {
            id: 'loans',
            name: 'Track Loans',
            description: 'Manage lending and borrowing',
            icon: <ClipboardList className="w-6 h-6" />,
            onClick: () => navigate({ to: '/dashboard/loan' }),
            color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
        },
        {
            id: 'splitwise',
            name: 'Split Expenses',
            description: 'Share costs with friends',
            icon: <StickyNote className="w-6 h-6" />,
            onClick: () => navigate({ to: '/dashboard/splitwise' }),
            color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
        },
        {
            id: 'expense',
            name: 'Personal Expenses',
            description: 'Track your spending',
            icon: <Trophy className="w-6 h-6" />,
            onClick: () => navigate({ to: '/dashboard/expense' }),
            color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
        },
        {
            id: 'income',
            name: 'Track Income',
            description: 'Monitor your earnings',
            icon: <Flag className="w-6 h-6" />,
            onClick: () => navigate({ to: '/dashboard/income' }),
            color: 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20',
        },
        {
            id: 'reminder',
            name: 'Set Reminders',
            description: 'Never miss important tasks',
            icon: <BellRing className="w-6 h-6" />,
            onClick: () => navigate({ to: '/dashboard/reminder' }),
            color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20',
        },
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-4xl space-y-8">
                {/* Logo and Welcome Message */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <PersonallyLogo width="300" height="36" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <Rocket className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold text-foreground">
                                Welcome to Personally!
                            </h1>
                        </div>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Get started by creating your first project. Choose from loan
                            tracking, expense splitting, personal finance management, and
                            more.
                        </p>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Card
                            key={action.id}
                            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                            onClick={action.onClick}
                        >
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <div
                                        className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center transition-colors`}
                                    >
                                        {action.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg text-foreground">
                                            {action.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Help Text */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Not sure where to start? Try creating a project to organize your
                        tasks.
                    </p>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsProjectDialogOpen(true)}
                        className="gap-2"
                    >
                        <Folder className="w-5 h-5" />
                        Create Your First Project
                    </Button>
                </div>
            </div>

            {/* Project Creation Dialog */}
            <CreateNewProjectDialog
                open={isProjectDialogOpen}
                onOpenChange={setIsProjectDialogOpen}
            />
        </div>
    )
}
