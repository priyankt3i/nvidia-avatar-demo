import { z } from 'zod';
import { authedProcedure, router } from '../context';
import { getSignedDownloadUrl } from '@dhm/shared';

export const downloadsRouter = router({
	getSignedUrl: authedProcedure.input(z.object({ orderId: z.string() })).query(async ({ ctx, input }) => {
		const order = await ctx.prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
		if (order.userId !== ctx.session!.userId) throw new Error('FORBIDDEN');
		if (!order.renderUrl) throw new Error('Not ready');
		// renderUrl is stored as key for R2 in MVP
		const url = await getSignedDownloadUrl(order.renderUrl);
		return { url };
	}),
});