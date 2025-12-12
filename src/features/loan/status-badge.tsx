import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function GetStatusBadge({
  status,
}: {
  status: 'active' | 'paid' | 'overdue' | 'partially_paid'
}) {
  const variants: Record<
    string,
    { label: string; className: string; icon: any }
  > = {
    active: {
      label: 'Active',
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      icon: Clock,
    },
    paid: {
      label: 'Paid',
      className:
        'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      icon: CheckCircle,
    },
    overdue: {
      label: 'Overdue',
      className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      icon: AlertCircle,
    },
    partially_paid: {
      label: 'Partially Paid',
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      icon: Clock,
    },
  }

  const variant = variants[status] || variants.active
  const Icon = variant.icon

  return (
    <Badge className={cn('flex items-center gap-1', variant.className)}>
      <Icon className="size-3" />
      {variant.label}
    </Badge>
  )
}
