import { z } from 'zod';
import { adminProcedure, router } from '../context';

export const adminRouter = router({
	characters: router({
		upsert: adminProcedure
			.input(
				z.object({
					id: z.string().optional(),
					slug: z.string(),
					displayName: z.string(),
					bio: z.string(),
					traits: z.any(),
					voiceId: z.string().nullable().optional(),
					pricingCents: z.number().int(),
					demoVideoUrl: z.string().nullable().optional(),
					posterUrl: z.string().nullable().optional(),
					status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
				})
			)
			.mutation(async ({ ctx, input }) => {
				const { id, ...rest } = input;
				if (id) return ctx.prisma.character.update({ where: { id }, data: rest });
				return ctx.prisma.character.create({ data: rest });
			}),
	}),
	jobs: router({
		retry: adminProcedure.input(z.object({ orderId: z.string() })).mutation(async ({ ctx, input }) => {
			// TODO: re-enqueue job
			return { ok: true };
		}),
	}),
	moderate: adminProcedure.input(z.object({ orderId: z.string(), action: z.enum(['APPROVE', 'REJECT']), reason: z.string().optional() })).mutation(async () => {
		// TODO moderation record
		return { ok: true };
	}),
});