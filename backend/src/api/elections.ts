import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Get elections
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const elections = await prisma.election.findMany({
      include: {
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(elections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// Create election
router.post('/', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const election = await prisma.election.create({ data });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_ELECTION',
        details: `Created election ${election.title}`,
      }
    });

    res.json(election);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// Update election (start/stop)
router.patch('/:id', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // If setting to active, maybe stop others depending on rules
    const election = await prisma.election.update({
      where: { id: Number(id) },
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_ELECTION',
        details: `Updated election ${election.id} to status ${data.status}`,
      }
    });

    res.json(election);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update election' });
  }
});

// Get election results
router.get('/:id/results', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Get votes grouped by candidate
    const results = await prisma.vote.groupBy({
      by: ['candidateId'],
      where: { electionId: Number(id) },
      _count: { id: true },
    });
    
    // Also attach candidate details
    const candidates = await prisma.candidate.findMany({
      where: { id: { in: results.map(r => r.candidateId) } },
      select: { id: true, displayName: true, username: true }
    });

    const detailedResults = results.map(r => {
      const c = candidates.find(cand => cand.id === r.candidateId);
      return {
        candidateId: r.candidateId,
        displayName: c?.displayName || 'Unknown',
        username: c?.username,
        votes: r._count.id
      };
    });

    res.json(detailedResults);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
