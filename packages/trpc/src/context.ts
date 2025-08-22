import type { inferAsyncReturnType } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import prisma from '@dhm/db/src/client';

export async function createContext(opts: { session?: { userId: string; role?: string } | null } = {}) {
	return { prisma, session: opts.session ?? null };
}

export type Context = inferAsyncReturnType<typeof createContext>;

export const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session?.userId) throw new Error('UNAUTHORIZED');
	return next();
});
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (ctx.session?.role !== 'ADMIN') throw new Error('FORBIDDEN');
	return next();
});