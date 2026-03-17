import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

let app: INestApplication;
let prisma: PrismaService;

/**
 * Bootstrap the NestJS test application with all modules.
 * Uses the real Prisma client (requires a running test PostgreSQL database).
 */
export async function getApp(): Promise<INestApplication> {
  if (app) return app;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  prisma = app.get(PrismaService);

  return app;
}

/**
 * Get the Prisma service from the test app.
 */
export function getPrisma(): PrismaService {
  return prisma;
}

/**
 * Log in with the APP_SECRET and return a Bearer JWT token.
 * Requires the test database to have a seeded user and APP_SECRET env var set.
 */
export async function getAuthToken(): Promise<string> {
  const supertest = await import('supertest');
  const application = await getApp();
  const appSecret = process.env.APP_SECRET || 'test-secret';

  const res = await supertest.default(application.getHttpServer())
    .post('/auth/login')
    .send({ password: appSecret })
    .expect(200);

  return res.body.accessToken as string;
}

/**
 * Truncate test data between tests.
 * Deletes data from all tables in the correct order to respect foreign key constraints,
 * but preserves the seeded user record.
 */
export async function cleanDb(): Promise<void> {
  const db = getPrisma();

  // Delete in reverse dependency order
  await db.studySession.deleteMany();
  await db.planAssignment.deleteMany();
  await db.learningItem.deleteMany();
  await db.category.deleteMany();
  // Do NOT delete users — keep seed user for auth
}

/**
 * Tear down the test application.
 */
export async function closeApp(): Promise<void> {
  if (app) {
    await app.close();
  }
}
