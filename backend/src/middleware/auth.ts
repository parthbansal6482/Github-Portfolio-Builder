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

// Auth middleware — validates NextAuth JWT from Authorization header
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    try {
      // NextAuth JWTs are signed with NEXTAUTH_SECRET
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
      // Invalid token — don't set req.user, let requireAuth handle 401
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
