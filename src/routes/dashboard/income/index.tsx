import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/income/"!</div>
}
