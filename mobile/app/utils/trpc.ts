// mobile/app/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@server/router';

export const trpc = createTRPCReact<AppRouter>();

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined in .env');
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: API_URL,
    }),
  ],
});
