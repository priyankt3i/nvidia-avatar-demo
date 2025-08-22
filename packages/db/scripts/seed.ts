import prisma from '../src/client';

async function main() {
	const demo = await prisma.character.upsert({
		where: { slug: 'ava-demo' },
		create: {
			slug: 'ava-demo',
			displayName: 'Ava Demo',
			bio: 'Ava is a friendly, professional digital human suited for product explainers and brand reads.',
			traits: { emotions: ['neutral', 'friendly', 'excited', 'serious'], style: ['concise', 'warm'] },
			voiceId: null,
			pricingCents: 2999,
			demoVideoUrl: null,
			posterUrl: null,
			memoryIndexId: null,
		},
		update: {},
	});

	const memories = [
		{ kind: 'lore', content: 'Ava prefers warm, inclusive language and avoids technical jargon.' },
		{ kind: 'style', content: 'Keep sentences short. Use contractions. Smile in the voice.' },
		{ kind: 'brand_guidelines', content: 'Never make medical or financial claims. Avoid political content.' },
	];

	for (const m of memories) {
		await prisma.memory.create({ data: { characterId: demo.id, kind: m.kind, content: m.content, embedding: Buffer.from('') } });
	}

	console.log('Seed complete. Character:', demo.slug);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
}).finally(async () => {
	await prisma.$disconnect();
});