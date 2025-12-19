import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex size-full items-center justify-center p-2 text-2xl">
      <main
        className=
        "h-screen w-full flex items-start md:items-center justify-center py-16 px-4 md:py-24 md:px-20">
        <div className="fixed inset-0 z-0 opacity-50 bg-[image:linear-gradient(to_right,var(--muted-foreground),transparent_1px),linear-gradient(to_bottom,var(--muted-foreground),transparent_1px)] [background-size:32px_32px] md:[background-size:48px_48px] [mask-image:radial-gradient(ellipse_60%_30%_at_50%_0%,black_0%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_30%_30%_at_50%_20%,black_0%,transparent_100%)]" />
        <section className="flex flex-col items-center gap-8 md:gap-16 z-10">
          <div className="flex flex-col items-center gap-8 md:gap-12">
            <header className="flex flex-col items-center gap-4">
              <div>
                <Badge
                  variant="outline"
                  className="px-2.5 py-1 text-sm font-medium"
                >
                  <div className="size-2 bg-primary rounded-full" />
                  404
                </Badge>
              </div>
              <div className="flex flex-col items-center gap-4 md:gap-6">
                <h1 className="text-center text-4xl md:text-6xl font-semibold">
                  404 - Page Not Found
                </h1>
                <p className="text-center text-lg md:text-xl text-muted-foreground">
                  Oops! The page you're looking for doesn't exist.
                </p>
              </div>
            </header>
            <div className="flex gap-3 flex-col md:flex-row w-full items-center justify-center">
              <Button
                className="w-full md:w-fit"
                variant="outline"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button className="w-full md:w-fit" onClick={() => window.location.href = '/dashboard'}>
                Go Home
              </Button>
            </div>
          </div>
        </section>
      </main >
    </div >
  )
}
