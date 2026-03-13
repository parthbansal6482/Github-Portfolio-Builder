import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard — return current user's portfolio row + view count
router.get('/', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'dashboard' });
});

export default router;
