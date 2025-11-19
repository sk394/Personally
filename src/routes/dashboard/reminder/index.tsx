import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/reminder/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/reminder/"!</div>
}
