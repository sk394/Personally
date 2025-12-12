import { publicRouter } from './routes/public'
import { todoRouter } from './routes/todo'
import { userRouter } from './routes/user'
import { categoryRouter } from './routes/category'
import { projectRouter } from './routes/project'
import { loanRouter } from './routes/loan'
import { splitwiseRouter } from './routes/splitwise'
import { createTRPCRouter } from '@/integrations/trpc/init'

export const trpcRouter = createTRPCRouter({
  todo: todoRouter,
  public: publicRouter,
  user: userRouter,
  category: categoryRouter,
  project: projectRouter,
  loan: loanRouter,
  splitwise: splitwiseRouter,
})

export type TRPCRouter = typeof trpcRouter
