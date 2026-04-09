import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Get all candidates
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        _count: {
          select: { votes: true, applicationLogs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Update candidate status/visibility
router.patch('/:id', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // allow changing extraInfo, status, isHidden, notes etc
    const candidate = await prisma.candidate.update({
      where: { id: Number(id) },
      data
    });
    
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_CANDIDATE',
        details: `Updated candidate ${id}`,
      }
    });

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Manually add candidate
router.post('/', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { displayName, username, telegramId, extraInfo, status } = req.body;
    const candidate = await prisma.candidate.create({
      data: {
        displayName,
        username,
        telegramId,
        extraInfo,
        status: status || 'APPROVED', // Default manually added to approved for voting
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'ADD_CANDIDATE',
        details: `Manually added candidate ${candidate.id}`,
      }
    });

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

// Delete candidate
router.delete('/:id', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // We must delete associated applications and votes first or use Prisma cascade. 
    // Since cascade is not set up dynamically for all, let's just delete related things manually:
    await prisma.vote.deleteMany({ where: { candidateId: Number(id) } });
    await prisma.application.deleteMany({ where: { candidateId: Number(id) } });

    await prisma.candidate.delete({ where: { id: Number(id) } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'DELETE_CANDIDATE',
        details: `Deleted candidate ${id}`,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete Candidate Error:', error);
    res.status(500).json({ error: 'Failed to delete candidate', details: error.message });
  }
});

export default router;
