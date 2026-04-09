import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' },
  });

  if (existingAdmin) {
    console.log('Super Admin already exists. Skipping seed.');
    return;
  }

  await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('Super Admin user created successfully.');
  console.log('Username: admin');
  console.log(`Password: ${adminPassword}`);
  
  // Seed default settings if they don't exist
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    const defaultSettings = [
      { key: 'bot_welcome_text', value: 'Merhabalar! Yönetim ve Adaylık botuna hoş geldiniz.' },
      { key: 'bot_apply_button', value: 'Adaylık Başvurusu Yap' },
      { key: 'bot_vote_button', value: 'Oy Ver' },
      { key: 'application_is_open', value: 'true' },
    ];
    
    for (const s of defaultSettings) {
      await prisma.settings.create({ data: s });
    }
    console.log('Default settings seeded.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
