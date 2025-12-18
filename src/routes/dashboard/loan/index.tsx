import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/loan/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/loan/"!</div>
}
