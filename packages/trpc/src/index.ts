import { router } from './context';
import { charactersRouter } from './routers/characters';
import { ordersRouter } from './routers/orders';
import { jobsRouter } from './routers/jobs';
import { downloadsRouter } from './routers/downloads';
import { adminRouter } from './routers/admin';

export const appRouter = router({
	auth: router({
		getSession: () => ({}) // handled in Next app
	}),
	characters: charactersRouter,
	orders: ordersRouter,
	jobs: jobsRouter,
	downloads: downloadsRouter,
	admin: adminRouter,
});

export type AppRouter = typeof appRouter;