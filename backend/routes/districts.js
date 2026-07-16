import express from 'express';
const router = express.Router();
// GET /api/districts - return stats for all 38 districts
router.get('/', async (req, res) => { res.json({ districts: [] }); });
router.get('/:name', async (req, res) => { res.json({ name: req.params.name }); });
export default router;
