import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

export const prisma = new PrismaClient();

import authRoutes from './api/auth';
import applicationRoutes from './api/applications';
import candidateRoutes from './api/candidates';
import electionRoutes from './api/elections';
import settingsRoutes from './api/settings';
import dashboardRoutes from './api/dashboard';
import { setupBot } from './bot';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('Telegram Admin API is running.');
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Connected to database.');
    
    await setupBot();
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
