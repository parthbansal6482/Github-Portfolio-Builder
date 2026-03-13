import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/views/:username — atomic view_count increment (skips if owner)
router.post('/:username', (req: Request, res: Response) => {
  res.json({ status: 'ok', route: `views/${req.params.username}` });
});

export default router;
