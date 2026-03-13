import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info from auth
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        githubUsername: string;
        accessToken: string;
      };
    }
  }
}

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

// Auth middleware — validates JWT or raw GitHub OAuth token from Authorization header
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    // --- Path 1: Raw GitHub OAuth token (gho_ prefix) ---
    if (token.startsWith('gho_') || token.startsWith('ghp_')) {
      try {
        const ghRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'GitFolio-Backend',
          },
        });

        if (ghRes.ok) {
          const ghUser = await ghRes.json() as { id: number; login: string };
          req.user = {
            id: String(ghUser.id),
            githubUsername: ghUser.login,
            accessToken: token,
          };
        }
      } catch {
        // GitHub API unreachable — req.user stays unset, requireAuth will 401
      }
    } else {
      // --- Path 2: NextAuth JWT signed with NEXTAUTH_SECRET ---
      try {
        const decoded = jwt.verify(token, NEXTAUTH_SECRET) as {
          sub?: string;
          userId?: string;
          githubUsername?: string;
          accessToken?: string;
        };

        req.user = {
          id: decoded.userId || decoded.sub || '',
          githubUsername: decoded.githubUsername || '',
          accessToken: decoded.accessToken || '',
        };
      } catch {
        // Invalid JWT — req.user stays unset, requireAuth will 401
      }
    }
  }

  next();
};

// Middleware that requires auth — returns 401 if no user
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
        status: 401,
      },
    });
    return;
  }
  next();
};
