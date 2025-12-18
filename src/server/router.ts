import { publicRouter } from './routes/public'
import { userRouter } from './routes/user'
import { categoryRouter } from './routes/category'
import { projectRouter } from './routes/project'
import { loanRouter } from './routes/loan'
import { splitwiseRouter } from './routes/splitwise'
import { aiRouter } from './routes/ai'
import { createTRPCRouter } from '@/integrations/trpc/init'

export const trpcRouter = createTRPCRouter({
  public: publicRouter,
  user: userRouter,
  category: categoryRouter,
  project: projectRouter,
  loan: loanRouter,
  splitwise: splitwiseRouter,
  ai: aiRouter,
})

export type TRPCRouter = typeof trpcRouter

