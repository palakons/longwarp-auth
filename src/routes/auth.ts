import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../db';
import { requireAuth, sendAuthCookie, clearAuthCookie } from '../middleware/auth';

const router = Router();

const getOAuth2Client = (): OAuth2Client => {
  return new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.callbackUrl
  );
};

// Validate redirect target to prevent open redirect vulnerabilities
const sanitizeRedirectUrl = (redirectUrl?: string): string => {
  if (!redirectUrl) {
    return 'https://shabu.longwarp.com';
  }

  try {
    const parsed = new URL(redirectUrl);
    // Allow longwarp.com domains, its subdomains, and localhost/127.0.0.1 for local dev
    const isAllowedDomain =
      parsed.hostname === 'longwarp.com' ||
      parsed.hostname.endsWith('.longwarp.com') ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1';

    if (isAllowedDomain) {
      return redirectUrl;
    }
  } catch {
    // Relative path support (e.g. /dashboard)
    if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return redirectUrl;
    }
  }

  return 'https://shabu.longwarp.com';
};

/**
 * GET /auth/google
 * Initiates the Google OAuth 2.0 flow. Accepts optional ?redirect=...
 */
router.get('/auth/google', (req: Request, res: Response) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    res.status(500).json({
      error: 'Google OAuth is not configured. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
    });
    return;
  }

  const redirectTarget = sanitizeRedirectUrl(req.query.redirect as string | undefined);
  const state = Buffer.from(JSON.stringify({ redirect: redirectTarget })).toString('base64');

  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'select_account',
    state,
  });

  res.redirect(authUrl);
});

/**
 * GET /auth/google/callback
 * Handles Google OAuth callback, upserts user, sets auth cookie, and redirects
 */
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    res.status(400).send(`Google authentication error: ${error}`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.status(400).send('Invalid or missing authorization code from Google.');
    return;
  }

  let redirectTarget = 'https://shabu.longwarp.com';
  if (state && typeof state === 'string') {
    try {
      const parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (parsedState.redirect) {
        redirectTarget = sanitizeRedirectUrl(parsedState.redirect);
      }
    } catch {
      // Use fallback default
    }
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let googleId = '';
    let email = '';
    let displayName: string | null = null;
    let avatarUrl: string | null = null;

    if (tokens.id_token) {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.google.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Missing ID token payload');
      }
      googleId = payload.sub;
      email = payload.email || '';
      displayName = payload.name || null;
      avatarUrl = payload.picture || null;
    } else {
      // Fallback: Fetch userinfo endpoint directly
      const userInfoResponse = await oauth2Client.request<{
        id?: string;
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      }>({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      });
      googleId = userInfoResponse.data.sub || userInfoResponse.data.id || '';
      email = userInfoResponse.data.email || '';
      displayName = userInfoResponse.data.name || null;
      avatarUrl = userInfoResponse.data.picture || null;
    }

    if (!googleId || !email) {
      res.status(400).send('Failed to obtain Google ID or email address from profile.');
      return;
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { googleId },
      update: {
        email,
        displayName,
        avatarUrl,
        lastLoginAt: new Date(),
      },
      create: {
        googleId,
        email,
        displayName,
        avatarUrl,
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT auth token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    sendAuthCookie(res, token);

    res.redirect(redirectTarget);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    res.status(500).send(`Authentication failed: ${err.message || 'Internal Server Error'}`);
  }
});

/**
 * GET /auth/me
 * Returns authenticated user profile or 401
 */
router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

/**
 * POST /auth/logout
 * Clears HTTP-only authentication cookie
 */
router.post('/auth/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
