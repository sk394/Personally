import * as React from 'react'
import { motion } from 'motion/react'
import { DollarSign, FolderOpen, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProjectTypeOption {
  type: 'loan' | 'splitwise' | 'general'
  name: string
  description: string
  icon: React.ReactNode
}

interface ProjectTypeSelectorProps {
  selectedType?: ProjectTypeOption['type']
  onTypeSelect: (type: ProjectTypeOption['type']) => void
  className?: string
  autoFocus?: boolean
}

const projectTypeOptions: Array<ProjectTypeOption> = [
  {
    type: 'loan',
    name: 'Loan Tracker',
    description: "Track money you've lent or borrowed with friends and family",
    icon: <DollarSign className="size-6" />,
  },
  {
    type: 'splitwise',
    name: 'Expense Splitting',
    description: 'Split bills and expenses fairly among group members',
    icon: <Users className="size-6" />,
  },
  // {
  //   type: 'general',
  //   name: 'General Project',
  //   description: 'A flexible project for any financial tracking needs',
  //   icon: <FolderOpen className="size-6" />,
  // },
]

export function ProjectTypeSelector({
  selectedType,
  onTypeSelect,
  className,
  autoFocus,
}: ProjectTypeSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {projectTypeOptions.map((option) => (
        <motion.button
          key={option.type}
          type="button"
          onClick={() => onTypeSelect(option.type)}
          className={cn(
            'w-full p-4 rounded-lg border-2 transition-all text-left group',
            'hover:border-indigo-300 dark:hover:border-indigo-700',
            selectedType === option.type
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-zinc-200 dark:border-zinc-800',
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          autoFocus={autoFocus}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex-shrink-0 p-2 rounded-lg transition-colors',
                selectedType === option.type
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-400',
              )}
            >
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'font-semibold text-base mb-1',
                  selectedType === option.type
                    ? 'text-indigo-900 dark:text-indigo-100'
                    : 'text-zinc-900 dark:text-zinc-100',
                )}
              >
                {option.name}
              </div>
              <div
                className={cn(
                  'text-sm leading-relaxed',
                  selectedType === option.type
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-zinc-600 dark:text-zinc-400',
                )}
              >
                {option.description}
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

export { projectTypeOptions }
