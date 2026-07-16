import express from 'express';
const router = express.Router();
router.get('/', async (req, res) => { res.json({ devices: [] }); });
router.post('/', async (req, res) => { res.status(201).json({ id: `DEV_${Date.now()}`, ...req.body }); });
router.patch('/:id', async (req, res) => { res.json({ id: req.params.id, ...req.body }); });
export default router;
