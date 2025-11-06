import { Router } from 'express';
import { z } from 'zod';
import { Playlist } from '../models/Playlist';

const router = Router();

const listQuerySchema = z.object({
	search: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10)
});

router.get('/', async (req, res) => {
	const parsed = listQuerySchema.safeParse(req.query);
	if (!parsed.success) {
		res.status(400).json({ message: 'Invalid query', errors: parsed.error.flatten() });
		return;
	}
	const { search, page, limit } = parsed.data;
	const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
	const skip = (page - 1) * limit;
	const pipeline = [
		{ $match: filter },
		{ $sort: { name: 1 as 1} },
		{ $skip: skip },
		{ $limit: limit },
		{ $project: { name: 1, itemCount: { $size: '$items' } } }
	];
	const [items, total] = await Promise.all([
		Playlist.aggregate(pipeline).collation({ locale: 'en', strength: 2 }),
		Playlist.countDocuments(filter)
	]);
	res.json({ items, total, page, limit });
});

const createSchema = z.object({
	name: z.string().min(1),
	itemUrls: z
		.array(z.string().url())
		.max(10)
		.optional()
});

router.post('/', async (req, res) => {
	const parsed = createSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
		return;
	}
	const { name, itemUrls } = parsed.data;
	const items = (itemUrls || []).map((u) => ({ url: u }));
	const created = await Playlist.create({ name, items });
	res.status(201).json({ _id: created._id, name: created.name, itemCount: created.items.length });
});

router.get('/:id', async (req, res) => {
	const id = req.params.id;
	try {
		const doc = await Playlist.findById(id).lean();
		if (!doc) {
			res.status(404).json({ message: 'Not found' });
			return;
		}
		res.json({ _id: doc._id, name: doc.name, items: (doc.items || []).map((i) => ({ url: i.url })) });
	} catch {
		res.status(400).json({ message: 'Invalid id' });
	}
});

export default router;

