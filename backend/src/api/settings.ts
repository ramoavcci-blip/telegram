import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Get settings
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findMany();
    // Convert array of objects to a key-value object
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', authenticate, requireRole(['SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const data = req.body; // Expects an object of key-value pairs
    
    for (const key of Object.keys(data)) {
      const value = String(data[key]);
      await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_SETTINGS',
        details: `Updated ${Object.keys(data).length} settings`,
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
