import { createTRPCRouter } from "@/integrations/trpc/init";
import { publicRouter } from "./routes/public";
import { todoRouter } from "./routes/todo";
import { userRouter } from "./routes/user";
import { categoryRouter } from "./routes/category";
import { projectRouter } from "./routes/project";
import { loanRouter } from "./routes/loan";

export const trpcRouter = createTRPCRouter({
  todo: todoRouter,
  public: publicRouter,
  user: userRouter,
  category: categoryRouter,
  project: projectRouter,
  loan: loanRouter,
});

export type TRPCRouter = typeof trpcRouter;