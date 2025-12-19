import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth/auth'
import PersonallyLogo from '@/components/logo'


const authStateFn = createServerFn({ method: 'GET' }).handler(async ({ }) => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) {
    throw redirect({
      to: '/signin',
    })
  }

  return { userId: session.user?.id }
})

export const Route = createFileRoute('/dashboard/splitwise/')({
  component: RouteComponent,
  beforeLoad: async () => await authStateFn(),

})

function RouteComponent() {

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex-1 flex items-center justify-center px-4 py-2 sm:py-6">
        <div className="w-full max-w-2xl items-center justify-center flex">
          <PersonallyLogo width="350" height="40" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 mt-8">
        <p className="text-lg text-muted-foreground text-center">
          Please choose or create a Splitwise project from the dashboard.
        </p>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

    </div>
  )
}
