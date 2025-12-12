import { useState } from 'react'
import { DollarSign, Users, Folder, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

type ProjectType = 'loan' | 'splitwise' | 'general'

interface ProjectFilterProps {
    selectedTypes: ProjectType[]
    onFilterChange: (types: ProjectType[]) => void
    projectCounts?: {
        loan: number
        splitwise: number
        general: number
    }
}

const projectTypeOptions = [
    {
        value: 'loan' as const,
        label: 'Loan Tracker',
        icon: DollarSign,
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    {
        value: 'splitwise' as const,
        label: 'Splitwise',
        icon: Users,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    {
        value: 'general' as const,
        label: 'General Project',
        icon: Folder,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
]

export function ProjectFilter({
    selectedTypes,
    onFilterChange,
    projectCounts,
}: ProjectFilterProps) {
    const [open, setOpen] = useState(false)

    const handleToggle = (type: ProjectType) => {
        const newTypes = selectedTypes.includes(type)
            ? selectedTypes.filter((t) => t !== type)
            : [...selectedTypes, type]
        onFilterChange(newTypes)
    }

    const handleSelectAll = () => {
        onFilterChange(['loan', 'splitwise', 'general'])
    }

    const handleClearAll = () => {
        onFilterChange([])
    }

    const activeFilterCount =
        selectedTypes.length === 3 ? 0 : selectedTypes.length

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <ListFilter className="size-4" />
                    Filter by Type
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Project Type</h4>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleSelectAll}
                            >
                                All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={handleClearAll}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        {projectTypeOptions.map((option) => {
                            const Icon = option.icon
                            const count = projectCounts?.[option.value] || 0
                            const isChecked = selectedTypes.includes(option.value)

                            return (
                                <div
                                    key={option.value}
                                    className="flex items-center space-x-3 cursor-pointer group"
                                    onClick={() => handleToggle(option.value)}
                                >
                                    <Checkbox
                                        id={option.value}
                                        checked={isChecked}
                                        onCheckedChange={() => handleToggle(option.value)}
                                    />
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className={`p-1.5 rounded ${option.color}`}>
                                            <Icon className="size-4" />
                                        </div>
                                        <Label
                                            htmlFor={option.value}
                                            className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {option.label}
                                        </Label>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs px-2 tabular-nums"
                                        >
                                            {count}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function QuickFilterTabs({
    selectedType,
    onTypeChange,
    projectCounts,
}: {
    selectedType: ProjectType | 'all'
    onTypeChange: (type: ProjectType | 'all') => void
    projectCounts?: {
        loan: number
        splitwise: number
        general: number
        all: number
    }
}) {
    const tabs = [
        { value: 'all' as const, label: 'All Projects', icon: Folder },
        ...projectTypeOptions,
    ]

    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = selectedType === tab.value
                const count =
                    tab.value === 'all'
                        ? projectCounts?.all || 0
                        : projectCounts?.[tab.value] || 0

                return (
                    <Button
                        key={tab.value}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => onTypeChange(tab.value)}
                    >
                        <Icon className="size-4" />
                        {tab.label}
                        <Badge
                            variant={isActive ? 'secondary' : 'outline'}
                            className="ml-1 px-1.5 py-0 text-xs"
                        >
                            {count}
                        </Badge>
                    </Button>
                )
            })}
        </div>
    )
}
