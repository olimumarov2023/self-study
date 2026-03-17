import request from 'supertest';
import { getApp, getAuthToken, cleanDb, closeApp, getPrisma } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Planning (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await getApp();
    token = await getAuthToken();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeApp();
  });

  const authGet = (url: string) =>
    request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`);
  const authPost = (url: string) =>
    request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`);
  const authPatch = (url: string) =>
    request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`);

  /** Helper: create a learning item */
  async function createItem(title = 'Test Item') {
    const res = await authPost('/learning-items')
      .send({ title })
      .expect(201);
    return res.body;
  }

  // ── AC: User can assign items from backlog to monthly plan ──

  describe('assign', () => {
    it('assigns an item to a monthly period', async () => {
      const item = await createItem('Monthly Topic');

      const res = await authPost('/planning/assign')
        .send({
          learningItemId: item.id,
          level: 'MONTHLY',
          periodKey: '2026-03',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.level).toBe('MONTHLY');
      expect(res.body.periodKey).toBe('2026-03');
      expect(res.body.learningItem.id).toBe(item.id);
    });

    it('assigns an item to a weekly period', async () => {
      const item = await createItem('Weekly Topic');

      const res = await authPost('/planning/assign')
        .send({
          learningItemId: item.id,
          level: 'WEEKLY',
          periodKey: '2026-W12',
        })
        .expect(201);

      expect(res.body.level).toBe('WEEKLY');
      expect(res.body.periodKey).toBe('2026-W12');
    });

    it('assigns an item to a daily period', async () => {
      const item = await createItem('Daily Topic');

      const res = await authPost('/planning/assign')
        .send({
          learningItemId: item.id,
          level: 'DAILY',
          periodKey: '2026-03-17',
        })
        .expect(201);

      expect(res.body.level).toBe('DAILY');
      expect(res.body.periodKey).toBe('2026-03-17');
    });

    it('returns 404 when assigning non-existent item', async () => {
      await authPost('/planning/assign')
        .send({
          learningItemId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          level: 'MONTHLY',
          periodKey: '2026-03',
        })
        .expect(404);
    });

    it('returns 400 when periodKey format does not match level', async () => {
      const item = await createItem();

      await authPost('/planning/assign')
        .send({
          learningItemId: item.id,
          level: 'MONTHLY',
          periodKey: '2026-03-17', // wrong format for MONTHLY
        })
        .expect(400);
    });

    it('auto-increments rank for items in the same period', async () => {
      const item1 = await createItem('First');
      const item2 = await createItem('Second');

      const res1 = await authPost('/planning/assign')
        .send({ learningItemId: item1.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      const res2 = await authPost('/planning/assign')
        .send({ learningItemId: item2.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      expect(res2.body.rank).toBeGreaterThan(res1.body.rank);
    });
  });

  // ── AC: User can view month/week/day plan ──

  describe('get by period', () => {
    it('GET /planning/month/:yyyyMM returns assigned items', async () => {
      const item = await createItem('Monthly Topic');
      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'MONTHLY', periodKey: '2026-03' })
        .expect(201);

      const res = await authGet('/planning/month/2026-03').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].learningItem.title).toBe('Monthly Topic');
    });

    it('GET /planning/week/:yyyyWww returns assigned items', async () => {
      const item = await createItem('Weekly Topic');
      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'WEEKLY', periodKey: '2026-W12' })
        .expect(201);

      const res = await authGet('/planning/week/2026-W12').expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].learningItem.title).toBe('Weekly Topic');
    });

    it('GET /planning/day/:yyyyMMdd returns assigned items', async () => {
      const item = await createItem('Daily Topic');
      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      const res = await authGet('/planning/day/2026-03-17').expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].learningItem.title).toBe('Daily Topic');
    });

    it('returns empty array for a period with no assignments', async () => {
      const res = await authGet('/planning/month/2099-12').expect(200);
      expect(res.body).toEqual([]);
    });

    it('returns items ordered by rank', async () => {
      const item1 = await createItem('First');
      const item2 = await createItem('Second');

      await authPost('/planning/assign')
        .send({ learningItemId: item1.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);
      await authPost('/planning/assign')
        .send({ learningItemId: item2.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      const res = await authGet('/planning/day/2026-03-17').expect(200);

      expect(res.body[0].learningItem.title).toBe('First');
      expect(res.body[1].learningItem.title).toBe('Second');
      expect(res.body[0].rank).toBeLessThan(res.body[1].rank);
    });
  });

  // ── AC: Auto-distribute feature splits N items across M days evenly ──

  describe('auto-distribute', () => {
    it('creates daily assignments from weekly assignments', async () => {
      const item1 = await createItem('Topic A');
      const item2 = await createItem('Topic B');
      const item3 = await createItem('Topic C');

      // Assign all three to a weekly period
      await authPost('/planning/assign')
        .send({ learningItemId: item1.id, level: 'WEEKLY', periodKey: '2026-W12' })
        .expect(201);
      await authPost('/planning/assign')
        .send({ learningItemId: item2.id, level: 'WEEKLY', periodKey: '2026-W12' })
        .expect(201);
      await authPost('/planning/assign')
        .send({ learningItemId: item3.id, level: 'WEEKLY', periodKey: '2026-W12' })
        .expect(201);

      // Auto-distribute
      const res = await authPost('/planning/auto-distribute')
        .send({ weekPeriodKey: '2026-W12' })
        .expect(201);

      expect(res.body.created).toBe(3);
      expect(res.body.assignments.length).toBe(3);

      // All created assignments should be DAILY level
      for (const assignment of res.body.assignments) {
        expect(assignment.learningItem).toBeTruthy();
      }
    });

    it('returns 0 created when no weekly assignments exist', async () => {
      const res = await authPost('/planning/auto-distribute')
        .send({ weekPeriodKey: '2099-W52' })
        .expect(201);

      expect(res.body.created).toBe(0);
      expect(res.body.assignments).toEqual([]);
    });

    it('does not create duplicate daily assignments', async () => {
      const item = await createItem('Topic');

      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'WEEKLY', periodKey: '2026-W12' })
        .expect(201);

      // First auto-distribute
      const res1 = await authPost('/planning/auto-distribute')
        .send({ weekPeriodKey: '2026-W12' })
        .expect(201);
      expect(res1.body.created).toBe(1);

      // Second auto-distribute should not create duplicates
      const res2 = await authPost('/planning/auto-distribute')
        .send({ weekPeriodKey: '2026-W12' })
        .expect(201);
      expect(res2.body.created).toBe(0);
    });
  });

  // ── AC: Reorder updates ranks ──

  describe('reorder', () => {
    it('updates ranks for plan assignments', async () => {
      const item1 = await createItem('First');
      const item2 = await createItem('Second');

      const a1 = await authPost('/planning/assign')
        .send({ learningItemId: item1.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);
      const a2 = await authPost('/planning/assign')
        .send({ learningItemId: item2.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      // Swap ranks
      const res = await authPatch('/planning/reorder')
        .send({
          assignments: [
            { id: a1.body.id, rank: 1 },
            { id: a2.body.id, rank: 0 },
          ],
        })
        .expect(200);

      expect(res.body.updated).toBe(2);

      // Verify new order
      const list = await authGet('/planning/day/2026-03-17').expect(200);
      expect(list.body[0].learningItem.title).toBe('Second');
      expect(list.body[1].learningItem.title).toBe('First');
    });

    it('returns 400 when assignment IDs are not found', async () => {
      await authPatch('/planning/reorder')
        .send({
          assignments: [
            { id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', rank: 0 },
          ],
        })
        .expect(400);
    });
  });
});
