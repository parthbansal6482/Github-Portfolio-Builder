import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/generate — call LLM layer, return GeneratedCopy | FallbackCopy
router.post('/', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'generate' });
});

export default router;
