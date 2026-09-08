import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../db';

export interface AuthJwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const sendAuthCookie = (res: Response, token: string) => {
  res.cookie(config.cookie.name, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    domain: config.cookie.domain || undefined,
    maxAge: config.cookie.maxAge,
    path: '/',
  });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(config.cookie.name, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    domain: config.cookie.domain || undefined,
    path: '/',
  });
};

/**
 * Extracts and verifies token from Authorization header or cookie
 */
export const authenticateUser = async (req: Request): Promise<AuthenticatedUser | null> => {
  try {
    const token =
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      req.cookies?.[config.cookie.name];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AuthJwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return user || null;
  } catch {
    return null;
  }
};

/**
 * Middleware requiring authentication. Returns 401 if unauthenticated.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = await authenticateUser(req);

  if (!user) {
    res.status(401).json({
      authenticated: false,
      error: 'Authentication required. No valid session token or authorization header provided.',
    });
    return;
  }

  req.user = user;
  next();
};
