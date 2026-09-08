import { Router, Request, Response } from 'express';
import prisma from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/shabu/sessions
 * Record a new shabu dining session for the authenticated user
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

    if (totalTrays === undefined || totalCalories === undefined || proteinG === undefined || carbsG === undefined || fatG === undefined) {
      res.status(400).json({
        error: 'Missing required session metrics: totalTrays, totalCalories, proteinG, carbsG, and fatG are required.',
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

export default router;
