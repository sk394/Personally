import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Spotlight } from '@/components/ui/spotlight'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import { ChevronRight } from 'lucide-react'
import { LandingChat } from '@/components/landing-chat'


export const Route = createFileRoute('/(public)/')({
  component: HomePage,
  ssr: false,
})


function HomePage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background Elements */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <DottedGlowBackground
        className="pointer-events-none opacity-20 dark:opacity-40"
        opacity={1}
        gap={20}
        radius={1.2}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-600"
        glowColorDarkVar="--color-sky-500"
        speedMin={0.3}
        speedMax={1.2}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="group relative mb-8 rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
          >
            {/* Animated gradient border */}
            <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />

            {/* Background */}
            <div className="absolute inset-0 rounded-full bg-muted/90 backdrop-blur-sm" />

            {/* Content */}
            <span className="relative z-10 text-muted-foreground">
              Introducing Personally Beta
            </span>
          </motion.div>


          <h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            Financial management <br className="hidden sm:block" />
            <span className="text-foreground">made effortless.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            The minimalist tool for tracking expenses, managing personal loans,
            and splitting bills with grace. No clutter, just clarity.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-foreground px-8 font-medium text-background transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Launch Dashboard
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          {/* Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full mt-16"
          >
            <LandingChat />
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bottom-8 left-0 w-full px-8 mt-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Personally <small>by suman</small></span>
          <span className="h-4 w-px bg-border"></span>
          <a
            href="https://github.com/sk394/personally.git"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

