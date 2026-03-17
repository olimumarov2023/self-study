import request from 'supertest';
import { getApp, getAuthToken, cleanDb, closeApp } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Stats (e2e)', () => {
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
  async function createItem(title = 'Stats Item') {
    const res = await authPost('/learning-items')
      .send({ title })
      .expect(201);
    return res.body;
  }

  // ── AC: Stats available at day/week/month granularity ──

  describe('GET /stats/day', () => {
    it('returns expected shape with all stat fields', async () => {
      const res = await authGet('/stats/day?date=2026-03-17').expect(200);

      expect(res.body).toHaveProperty('date', '2026-03-17');
      expect(res.body).toHaveProperty('planned');
      expect(res.body).toHaveProperty('completed');
      expect(res.body).toHaveProperty('inProgress');
      expect(res.body).toHaveProperty('completionPct');
      expect(res.body).toHaveProperty('studyMinutes');
      expect(res.body).toHaveProperty('streak');

      expect(typeof res.body.planned).toBe('number');
      expect(typeof res.body.completed).toBe('number');
      expect(typeof res.body.inProgress).toBe('number');
      expect(typeof res.body.completionPct).toBe('number');
      expect(typeof res.body.studyMinutes).toBe('number');
      expect(typeof res.body.streak).toBe('number');
    });

    it('returns 400 for invalid date format', async () => {
      await authGet('/stats/day?date=invalid').expect(400);
    });

    it('returns zeros when no data exists for the date', async () => {
      const res = await authGet('/stats/day?date=2099-01-01').expect(200);

      expect(res.body.planned).toBe(0);
      expect(res.body.completed).toBe(0);
      expect(res.body.inProgress).toBe(0);
      expect(res.body.completionPct).toBe(0);
      expect(res.body.studyMinutes).toBe(0);
    });
  });

  describe('GET /stats/week', () => {
    it('returns expected shape with week key', async () => {
      const res = await authGet('/stats/week?week=2026-W12').expect(200);

      expect(res.body).toHaveProperty('week', '2026-W12');
      expect(res.body).toHaveProperty('planned');
      expect(res.body).toHaveProperty('completed');
      expect(res.body).toHaveProperty('studyMinutes');
      expect(res.body).toHaveProperty('streak');
    });

    it('returns 400 for invalid week format', async () => {
      await authGet('/stats/week?week=2026-03').expect(400);
    });
  });

  describe('GET /stats/month', () => {
    it('returns expected shape with month key', async () => {
      const res = await authGet('/stats/month?month=2026-03').expect(200);

      expect(res.body).toHaveProperty('month', '2026-03');
      expect(res.body).toHaveProperty('planned');
      expect(res.body).toHaveProperty('completed');
      expect(res.body).toHaveProperty('studyMinutes');
      expect(res.body).toHaveProperty('streak');
    });

    it('returns 400 for invalid month format', async () => {
      await authGet('/stats/month?month=March').expect(400);
    });
  });

  // ── AC: Stats reflect actual data ──

  describe('stats reflect actual data', () => {
    it('counts planned items for a day', async () => {
      const item1 = await createItem('Item A');
      const item2 = await createItem('Item B');

      await authPost('/planning/assign')
        .send({ learningItemId: item1.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);
      await authPost('/planning/assign')
        .send({ learningItemId: item2.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      const res = await authGet('/stats/day?date=2026-03-17').expect(200);

      expect(res.body.planned).toBe(2);
      expect(res.body.completed).toBe(0);
    });

    it('counts completed items when status is LEARNED', async () => {
      const item = await createItem('Learn Me');

      // Assign to today
      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      // Move to LEARNED
      await authPost(`/learning-items/${item.id}/move-status`)
        .send({ status: 'LEARNED' })
        .expect(201);

      const res = await authGet('/stats/day?date=2026-03-17').expect(200);

      expect(res.body.planned).toBe(1);
      expect(res.body.completed).toBe(1);
      expect(res.body.completionPct).toBe(100);
    });

    it('counts in-progress items', async () => {
      const item = await createItem('WIP Item');

      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      await authPost(`/learning-items/${item.id}/move-status`)
        .send({ status: 'IN_PROGRESS' })
        .expect(201);

      const res = await authGet('/stats/day?date=2026-03-17').expect(200);

      expect(res.body.inProgress).toBe(1);
    });

    it('sums study minutes from sessions on the given date', async () => {
      // Create two manual sessions totalling 150 minutes
      await authPost('/time/sessions/manual')
        .send({
          startedAt: '2026-03-17T09:00:00.000Z',
          endedAt: '2026-03-17T10:30:00.000Z',
        })
        .expect(201);

      await authPost('/time/sessions/manual')
        .send({
          startedAt: '2026-03-17T14:00:00.000Z',
          endedAt: '2026-03-17T15:00:00.000Z',
        })
        .expect(201);

      const res = await authGet('/stats/day?date=2026-03-17').expect(200);

      expect(res.body.studyMinutes).toBe(150); // 90 + 60
    });

    it('calculates completion percentage correctly', async () => {
      const item1 = await createItem('Done');
      const item2 = await createItem('Not done');

      await authPost('/planning/assign')
        .send({ learningItemId: item1.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);
      await authPost('/planning/assign')
        .send({ learningItemId: item2.id, level: 'DAILY', periodKey: '2026-03-17' })
        .expect(201);

      await authPost(`/learning-items/${item1.id}/move-status`)
        .send({ status: 'LEARNED' })
        .expect(201);

      const res = await authGet('/stats/day?date=2026-03-17').expect(200);

      expect(res.body.planned).toBe(2);
      expect(res.body.completed).toBe(1);
      expect(res.body.completionPct).toBe(50);
    });
  });
});
