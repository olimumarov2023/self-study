import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert the default single user
  const user = await prisma.user.upsert({
    where: { email: 'admin@self-study.local' },
    update: {},
    create: {
      email: 'admin@self-study.local',
      passwordHash: 'not-used-app-secret-auth',
      name: 'Admin',
    },
  });

  console.log(`Upserted user: ${user.email} (${user.id})`);

  // Default categories
  const categories = [
    { name: 'Theory', color: '#3B82F6' },
    { name: 'Automation', color: '#10B981' },
    { name: 'Mindset', color: '#F59E0B' },
    { name: 'Soft Skills', color: '#8B5CF6' },
    { name: 'Tools & Infrastructure', color: '#EF4444' },
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: cat.name,
        },
      },
      update: { color: cat.color },
      create: {
        userId: user.id,
        name: cat.name,
        color: cat.color,
      },
    });
    console.log(`Upserted category: ${category.name} (${category.id})`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
