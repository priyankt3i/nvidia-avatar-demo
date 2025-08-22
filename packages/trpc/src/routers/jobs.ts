import { z } from 'zod';
import { authedProcedure, router } from '../context';

export const jobsRouter = router({
	getStatus: authedProcedure.input(z.object({ orderId: z.string() })).query(async ({ ctx, input }) => {
		const order = await ctx.prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
		const job = await ctx.prisma.job.findUnique({ where: { orderId: input.orderId } });
		return { status: job?.status ?? 'QUEUED', progress: null, ttsUrl: order.ttsUrl, renderUrl: order.renderUrl };
	}),
});