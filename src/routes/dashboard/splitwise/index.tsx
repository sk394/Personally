import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/splitwise/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/splitwise/"!</div>
}
