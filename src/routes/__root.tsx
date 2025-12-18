import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { aiDevtoolsPlugin } from '@tanstack/react-ai-devtools'

import { Toaster } from 'sonner'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import type { TRPCRouter } from '@/server/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { seo } from '@/lib/seo'
import NotFound from '@/components/ui/not-found'
import PersonallyLogo from '@/components/logo'
import { ConfirmProvider } from '@/hooks/confirm-context'

export interface MyRouterContext {
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<TRPCRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'Personally',
        description: 'Your personal finance manager',
        keywords: 'personal, finance, manager, personally',
      }),
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: () => (
    <RootDocument>
      <ConfirmProvider>
        <Outlet />
      </ConfirmProvider>
    </RootDocument >
  ),
  notFoundComponent: () => <NotFound />,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-center" />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Personally',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
            {
              name: 'Drizzle Studio',
              render: () => (
                <iframe
                  src="https://local.drizzle.studio"
                  style={{
                    flexGrow: 1,
                    width: '100%',
                    height: '100%',
                    border: 0,
                  }}
                />
              ),
            },
            aiDevtoolsPlugin(),
          ]}
          eventBusConfig={{
            connectToServerBus: true,
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}
