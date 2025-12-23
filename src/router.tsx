import {
  ErrorComponent,
  createRouter as createTanstackRouter,
} from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import PersonallyLogo from '@/components/logo'

// Create a new router instance
export function getRouter() {
  const queryClient = TanstackQuery.createQueryClient()
  const serverHelpers = TanstackQuery.createServerHelpers({
    queryClient,
  })

  const router = createTanstackRouter({
    routeTree,
    context: {
      queryClient,
      trpc: serverHelpers,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultStaleTime: 0,
    defaultPreload: 'intent',
    defaultViewTransition: true,
    defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
    defaultPendingComponent: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full text-center md:w-90">
          <PersonallyLogo width="100%" height="67px" />
        </div>
      </div>
    ),
    Wrap: (props: { children: React.ReactNode }) => (
      <TanstackQuery.Provider queryClient={queryClient}>
        {props.children}
      </TanstackQuery.Provider>
    ),
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

// // Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
