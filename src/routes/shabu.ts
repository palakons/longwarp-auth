import { Router, Request, Response } from 'express';
import prisma from '../db';
import { requireAuth, authenticateUser } from '../middleware/auth';

const router = Router();

/**
 * POST /api/shabu/sessions
 * Record a new shabu dining session for the authenticated user
 * Supports Authorization: Bearer <token> header or session cookie
 */
router.post('/api/shabu/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      totalTrays,
      totalCalories,
      proteinG,
      carbsG,
      fatG,
      costThb = 299.0,
      itemsJson,
      sessionDate,
    } = req.body;

    if (
      totalTrays === undefined ||
      totalCalories === undefined ||
      proteinG === undefined ||
      carbsG === undefined ||
      fatG === undefined
    ) {
      res.status(400).json({
        error:
          'Missing required session metrics: totalTrays, totalCalories, proteinG, carbsG, and fatG are required.',
      });
      return;
    }

    const session = await prisma.shabuSession.create({
      data: {
        userId,
        sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
        totalTrays: Number(totalTrays),
        totalCalories: Number(totalCalories),
        proteinG: parseFloat(String(proteinG)),
        carbsG: parseFloat(String(carbsG)),
        fatG: parseFloat(String(fatG)),
        costThb: parseFloat(String(costThb)),
        itemsJson: itemsJson ?? [],
      },
    });

    res.status(201).json({
      success: true,
      sessionId: session.id,
      session,
    });
  } catch (error: any) {
    console.error('Error creating shabu session:', error);
    res.status(500).json({
      error: 'Failed to create shabu session',
      details: error.message,
    });
  }
});

/**
 * GET /api/shabu/sessions
 * Retrieve all shabu dining sessions for the authenticated user, ordered by sessionDate DESC
 */
router.get('/api/shabu/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const sessions = await prisma.shabuSession.findMany({
      where: { userId },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    res.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    console.error('Error fetching shabu sessions:', error);
    res.status(500).json({
      error: 'Failed to retrieve shabu sessions',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/shabu/sessions/:id
 * Delete a dining session by ID for the authenticated user
 */
router.delete('/api/shabu/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user!.id;

    await prisma.shabuSession.deleteMany({
      where: {
        id: sessionId,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error: any) {
    console.error('Failed to delete session:', error);
    return res.status(500).json({
      error: 'Failed to delete session',
      details: error.message,
    });
  }
});

/**
 * POST /api/shabu/telemetry
 * Fire-and-forget usage telemetry logging for guests and authenticated members
 */
router.post('/api/shabu/telemetry', async (req: Request, res: Response) => {
  try {
    const { eventType, anonSessionId, metadata } = req.body;
    let userId: string | null = null;

    // Check if user is authenticated via Bearer token or cookie
    const user = await authenticateUser(req);
    if (user) {
      userId = user.id;
    }

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipAddress = Array.isArray(rawIp)
      ? rawIp[0]
      : typeof rawIp === 'string'
      ? rawIp.split(',')[0].trim()
      : null;

    await prisma.shabuUsageEvent.create({
      data: {
        eventType: eventType || 'unknown',
        userId: userId || null,
        anonSessionId: anonSessionId || 'anon',
        metadata: metadata
          ? typeof metadata === 'string'
            ? metadata
            : JSON.stringify(metadata)
          : null,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
      },
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    // Always return 200 to prevent breaking client fire-and-forget calls
    console.error('Telemetry logging error:', e);
    return res.status(200).json({ success: false });
  }
});

/**
 * GET /api/shabu/admin/stats
 * Aggregate usage and activity statistics restricted to palakons@gmail.com
 */
router.get('/api/shabu/admin/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.email !== 'palakons@gmail.com') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const totalPageViews = await prisma.shabuUsageEvent.count({
      where: { eventType: 'page_view' },
    });

    const uniqueVisitorRows = await prisma.shabuUsageEvent.groupBy({
      by: ['anonSessionId'],
    });
    const totalUniqueVisitors = uniqueVisitorRows.length;

    const totalSessionsSaved = await prisma.shabuSession.count();

    const aggregateMacros = await prisma.shabuSession.aggregate({
      _sum: {
        totalCalories: true,
        proteinG: true,
      },
    });

    const recentEvents = await prisma.shabuUsageEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const recentSessions = await prisma.shabuSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.status(200).json({
      adminEmail: req.user.email,
      stats: {
        totalPageViews: totalPageViews || 0,
        totalUniqueVisitors: totalUniqueVisitors || 0,
        totalSessionsSaved: totalSessionsSaved || 0,
        totalCaloriesTracked: aggregateMacros._sum.totalCalories || 0,
        totalProteinTracked: aggregateMacros._sum.proteinG || 0,
      },
      recentEvents,
      recentSessions,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;
