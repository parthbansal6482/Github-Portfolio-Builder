import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/portfolio/:username — return public portfolio data (no auth required)
router.get('/:username', (req: Request, res: Response) => {
  res.json({ status: 'ok', route: `portfolio/${req.params.username}` });
});

// POST /api/portfolio/save — save approved generated_copy to DB
router.post('/save', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'portfolio/save' });
});

// POST /api/portfolio/save-preferences — save user preferences to DB
router.post('/save-preferences', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'portfolio/save-preferences' });
});

// POST /api/portfolio/publish — set is_published=true, call revalidate
router.post('/publish', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'portfolio/publish' });
});

// POST /api/portfolio/unpublish — set is_published=false, call revalidate
router.post('/unpublish', requireAuth, (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'portfolio/unpublish' });
});

export default router;
