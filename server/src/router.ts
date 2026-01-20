// server/src/router.ts
import { router, publicProcedure } from './trpc';
import { z } from 'zod';

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }).optional())
    .query(({ input }) => {
      return { message: `Hello ${input?.name ?? 'World'}!` };
    }),

  getTodos: publicProcedure.query(() => {
    return [
      { id: 1, title: 'Learn tRPC', done: false },
      { id: 2, title: 'Build app', done: false },
    ];
  }),
});

export type AppRouter = typeof appRouter;
