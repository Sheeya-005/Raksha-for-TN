import express from 'express';
const router = express.Router();
router.get('/', async (req, res) => { res.json({ users: [], total: 0 }); });
router.get('/:id', async (req, res) => { res.json({ id: req.params.id }); });
router.put('/:id', async (req, res) => { res.json({ id: req.params.id, ...req.body }); });
router.delete('/:id', async (req, res) => { res.json({ message: 'Deleted' }); });
export default router;
