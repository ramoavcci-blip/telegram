import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const totalApplications = await prisma.application.count();
    const pendingApplications = await prisma.application.count({ where: { status: 'PENDING' } });
    const approvedCandidates = await prisma.candidate.count({ where: { status: 'APPROVED' } });
    const rejectedApplications = await prisma.application.count({ where: { status: 'REJECTED' } });
    const blacklistedCandidates = await prisma.candidate.count({ where: { status: 'BLACKLISTED' } });
    const totalVotes = await prisma.vote.count();
    
    const activeElection = await prisma.election.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true, title: true }
    });

    res.json({
      totalApplications,
      pendingApplications,
      approvedCandidates,
      rejectedApplications,
      blacklistedCandidates,
      totalVotes,
      activeElection,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
