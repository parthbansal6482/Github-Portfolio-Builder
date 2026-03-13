import cors from 'cors';

// CORS middleware — allowlist frontend and subdomains only
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check exact match
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Check subdomain match (*.gitfolio.dev or *.localhost:3000)
    const appDomain = process.env.FRONTEND_URL || 'http://localhost:3000';
    const domainHost = new URL(appDomain).host;
    try {
      const originHost = new URL(origin).host;
      if (originHost.endsWith(`.${domainHost}`) || originHost === domainHost) {
        callback(null, true);
        return;
      }
    } catch {
      // Invalid URL — reject
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
