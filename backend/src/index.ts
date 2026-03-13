import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import githubRoutes from './routes/github.js';
import generateRoutes from './routes/generate.js';
import portfolioRoutes from './routes/portfolio.js';
import viewsRoutes from './routes/views.js';
import dashboardRoutes from './routes/dashboard.js';
import profileRoutes from './routes/profile.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// Global middleware
// ============================================

// CORS — allowlist frontend + subdomains only
app.use(corsMiddleware);

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Auth middleware — parses token on every request (does not enforce)
app.use(authMiddleware);

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/github', githubRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/views', viewsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);

// ============================================
// Global error handler (must be last)
// ============================================
app.use(errorHandler);

// ============================================
// Start server
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 GitFolio backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

export default app;
