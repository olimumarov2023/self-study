import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert the default single user
  let user = await prisma.user.findUnique({
    where: { email: 'admin@self-study.local' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@self-study.local',
        passwordHash: 'not-used-app-secret-auth',
        name: 'Admin',
      },
    });
    console.log(`Created user: ${user.email} (${user.id})`);
  } else {
    console.log(`User exists: ${user.email} (${user.id})`);
  }

  // Default categories
  const categories = [
    { name: 'Theory', color: '#3B82F6' },
    { name: 'Automation', color: '#10B981' },
    { name: 'Mindset', color: '#F59E0B' },
    { name: 'Soft Skills', color: '#8B5CF6' },
    { name: 'Tools & Infrastructure', color: '#EF4444' },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { userId: user.id, name: cat.name },
    });

    if (!existing) {
      const category = await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          color: cat.color,
        },
      });
      console.log(`Created category: ${category.name} (${category.id})`);
    } else {
      console.log(`Category exists: ${existing.name} (${existing.id})`);
    }
  }

  // Roadmap areas and skills — only seed if none exist yet
  const existingAreaCount = await prisma.roadmapArea.count();

  if (existingAreaCount === 0) {
    const roadmapAreas = [
      {
        name: 'Test Design',
        icon: 'clipboard-list',
        sortOrder: 1,
        skills: [
          'Test Case Design',
          'Boundary Value Analysis',
          'Equivalence Partitioning',
          'Risk-Based Testing',
          'Exploratory Testing',
          'Test Planning',
        ],
      },
      {
        name: 'Automation',
        icon: 'code-2',
        sortOrder: 2,
        skills: [
          'Playwright Basics',
          'Advanced Selectors',
          'Page Object Model',
          'CI/CD Integration',
          'Visual Regression',
          'API Test Automation',
        ],
      },
      {
        name: 'API Testing',
        icon: 'globe',
        sortOrder: 3,
        skills: [
          'REST API Fundamentals',
          'Postman/Newman',
          'GraphQL Testing',
          'Authentication Testing',
          'Contract Testing',
          'Performance Baseline',
        ],
      },
      {
        name: 'Performance Testing',
        icon: 'zap',
        sortOrder: 4,
        skills: [
          'Load Testing Basics',
          'k6 Fundamentals',
          'Bottleneck Analysis',
          'Stress Testing',
          'Endurance Testing',
        ],
      },
      {
        name: 'Leadership',
        icon: 'users',
        sortOrder: 5,
        skills: [
          'Test Strategy Writing',
          'Mentoring Juniors',
          'Stakeholder Communication',
          'QA Process Improvement',
          'Defect Advocacy',
        ],
      },
      {
        name: 'Tools & Infrastructure',
        icon: 'wrench',
        sortOrder: 6,
        skills: [
          'Docker for Testing',
          'Git Workflows',
          'Monitoring & Alerting',
          'Test Reporting',
          'Database Testing',
        ],
      },
    ];

    for (const area of roadmapAreas) {
      const created = await prisma.roadmapArea.create({
        data: {
          name: area.name,
          icon: area.icon,
          sortOrder: area.sortOrder,
          skills: {
            create: area.skills.map((skillName, index) => ({
              name: skillName,
              sortOrder: index + 1,
              status: 'AVAILABLE',
            })),
          },
        },
      });
      console.log(`Created roadmap area: ${created.name} with ${area.skills.length} skills`);
    }
  } else {
    console.log(`Skipped roadmap seed — ${existingAreaCount} areas already exist.`);
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
