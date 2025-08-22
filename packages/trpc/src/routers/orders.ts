import { z } from 'zod';
import { authedProcedure, router } from '../context';
import Stripe from 'stripe';

const scopeEnum = z.enum(['WEB_ORGANIC', 'PAID_SOCIAL', 'BROADCAST', 'INTERNAL_ONLY']);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-06-20' });

function estimatePriceCents(basePer30s: number, durationSec: number, scope: z.infer<typeof scopeEnum>) {
	const units = Math.max(1, Math.ceil(durationSec / 30));
	const scopeMultiplier = scope === 'WEB_ORGANIC' ? 1 : scope === 'PAID_SOCIAL' ? 2 : scope === 'BROADCAST' ? 4 : 0.8;
	return Math.round(basePer30s * units * scopeMultiplier);
}

export const ordersRouter = router({
	quote: authedProcedure
		.input(z.object({ characterId: z.string(), durationSec: z.number().min(15).max(600), scope: scopeEnum }))
		.query(async ({ ctx, input }) => {
			const character = await ctx.prisma.character.findUniqueOrThrow({ where: { id: input.characterId } });
			const totalCents = estimatePriceCents(character.pricingCents, input.durationSec, input.scope);
			return { totalCents, lineItems: [{ description: 'Video render', amount: totalCents }] };
		}),
	create: authedProcedure
		.input(
			z.object({
				characterId: z.string(),
				script: z.string().min(1).max(2000),
				emotion: z.string().min(1),
				durationSec: z.number().min(15).max(600),
				scope: scopeEnum,
				termMonths: z.number().min(1).max(36),
				territories: z.string().min(1),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const character = await ctx.prisma.character.findUniqueOrThrow({ where: { id: input.characterId } });
			const totalCents = estimatePriceCents(character.pricingCents, input.durationSec, input.scope);

			// TODO moderation via OpenAI

			const order = await ctx.prisma.order.create({
				data: {
					userId: ctx.session!.userId,
					characterId: input.characterId,
					script: input.script,
					emotion: input.emotion,
					durationSec: input.durationSec,
					totalCents,
				},
			});

			const pi = await stripe.paymentIntents.create({
				amount: totalCents,
				currency: 'usd',
				metadata: { orderId: order.id },
				automatic_payment_methods: { enabled: true },
			});

			await ctx.prisma.order.update({ where: { id: order.id }, data: { stripePiId: pi.id } });
			return { orderId: order.id, clientSecret: pi.client_secret };
		}),
	capture: authedProcedure
		.input(z.object({ orderId: z.string(), paymentIntentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const order = await ctx.prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
			if (order.stripePiId !== input.paymentIntentId) throw new Error('PaymentIntent mismatch');
			await ctx.prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
			// TODO: enqueue TTS job
			return { ok: true };
		}),
});