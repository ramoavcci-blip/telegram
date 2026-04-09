import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Get all applications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const apps = await prisma.application.findMany({
      include: {
        candidate: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status
router.patch('/:id/status', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // PENDING, APPROVED, REJECTED, BLACKLISTED
    
    // update app
    const app = await prisma.application.update({
      where: { id: Number(id) },
      data: { status, notes }
    });

    // Mirror status to candidate if necessary
    await prisma.candidate.update({
      where: { id: app.candidateId },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_APPLICATION_STATUS',
        details: `Application ${id} set to ${status}`,
      }
    });

    res.json(app);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', authenticate, requireRole(['SUPERADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const app = await prisma.application.findUnique({ where: { id: Number(id) } });
    if (!app) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Delete votes for the candidate first to avoid constraint errors
    await prisma.vote.deleteMany({ where: { candidateId: app.candidateId } });
    
    // Delete the application itself
    await prisma.application.delete({ where: { id: Number(id) } });

    // Delete the candidate so they can re-apply if they want
    await prisma.candidate.deleteMany({ where: { id: app.candidateId } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'DELETE_APPLICATION',
        details: `Deleted application ${id}`,
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete App Error:', error);
    res.status(500).json({ error: 'Failed to delete application', details: error.message });
  }
});

export default router;
