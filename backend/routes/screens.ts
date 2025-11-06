import { Router } from 'express';
import { z } from 'zod';
import { Screen } from '../models/Screen';
import { authenticate, requireRole } from '../middleware/auth';

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
	const filter = search
		? { name: { $regex: search, $options: 'i' } }
		: {};
	const skip = (page - 1) * limit;
	const [items, total] = await Promise.all([
		Screen.find(filter).collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).skip(skip).limit(limit),
		Screen.countDocuments(filter)
	]);
	res.json({ items, total, page, limit });
});

router.put('/:id', authenticate, requireRole('EDITOR'), async (req, res) => {
	const id = req.params.id;
	const doc = await Screen.findById(id);
	if (!doc) {
		res.status(404).json({ message: 'Not found' });
		return;
	}
	doc.isActive = !doc.isActive;
	await doc.save();
	res.json({ _id: doc._id, isActive: doc.isActive });
});

export default router;
