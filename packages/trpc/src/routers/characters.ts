import { z } from 'zod';
import { publicProcedure, router } from '../context';

export const charactersRouter = router({
	list: publicProcedure.query(async ({ ctx }) => {
		const chars = await ctx.prisma.character.findMany({
			where: { status: 'PUBLISHED' },
			select: {
				slug: true,
				displayName: true,
				pricingCents: true,
				posterUrl: true,
				demoVideoUrl: true,
				traits: true,
			},
		});
		return chars.map((c) => ({
			slug: c.slug,
			name: c.displayName,
			pricing: c.pricingCents,
			posterUrl: c.posterUrl,
			demoVideoUrl: c.demoVideoUrl,
			traits: c.traits,
		}));
	}),
	get: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
		return ctx.prisma.character.findUnique({ where: { slug: input.slug } });
	}),
});