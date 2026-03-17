import request from 'supertest';
import { getApp, getAuthToken, cleanDb, closeApp } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Time Tracking (e2e)', () => {
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

  /** Helper: create a learning item */
  async function createItem(title = 'Timer Item') {
    const res = await authPost('/learning-items')
      .send({ title })
      .expect(201);
    return res.body;
  }

  // ── AC: Timer can be linked to a specific learning item ──

  describe('start/stop sessions', () => {
    it('starts a session and returns it', async () => {
      const res = await authPost('/time/sessions/start')
        .send({})
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('startedAt');
      expect(res.body.endedAt).toBeNull();
      expect(res.body.durationMin).toBeNull();
    });

    it('starts a session linked to a learning item', async () => {
      const item = await createItem('Study Topic');

      const res = await authPost('/time/sessions/start')
        .send({ learningItemId: item.id })
        .expect(201);

      expect(res.body.learningItem).toBeTruthy();
      expect(res.body.learningItem.id).toBe(item.id);
    });

    it('verifies active session exists after start', async () => {
      await authPost('/time/sessions/start')
        .send({})
        .expect(201);

      const active = await authGet('/time/sessions/active').expect(200);

      expect(active.body).toBeTruthy();
      expect(active.body.endedAt).toBeNull();
    });

    it('stops a session and calculates durationMin', async () => {
      const started = await authPost('/time/sessions/start')
        .send({})
        .expect(201);

      const res = await authPost(`/time/sessions/${started.body.id}/stop`)
        .send({ note: 'Good session' })
        .expect(200);

      expect(res.body.endedAt).toBeTruthy();
      expect(typeof res.body.durationMin).toBe('number');
      expect(res.body.durationMin).toBeGreaterThanOrEqual(0);
    });

    it('prevents starting a second session while one is active', async () => {
      await authPost('/time/sessions/start')
        .send({})
        .expect(201);

      await authPost('/time/sessions/start')
        .send({})
        .expect(409);
    });

    it('returns 404 when stopping a non-existent session', async () => {
      await authPost('/time/sessions/clxxxxxxxxxxxxxxxxxxxxxxxxx/stop')
        .send({})
        .expect(404);
    });

    it('returns 400 when stopping an already stopped session', async () => {
      const started = await authPost('/time/sessions/start')
        .send({})
        .expect(201);

      await authPost(`/time/sessions/${started.body.id}/stop`)
        .send({})
        .expect(200);

      await authPost(`/time/sessions/${started.body.id}/stop`)
        .send({})
        .expect(400);
    });
  });

  // ── AC: Manual entry correction ──

  describe('manual session creation', () => {
    it('creates a manual session with startedAt, endedAt, and computed durationMin', async () => {
      const startedAt = '2026-03-17T09:00:00.000Z';
      const endedAt = '2026-03-17T10:30:00.000Z';

      const res = await authPost('/time/sessions/manual')
        .send({ startedAt, endedAt, note: 'Manual entry' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.durationMin).toBe(90); // 1.5 hours = 90 min
    });

    it('creates a manual session linked to a learning item', async () => {
      const item = await createItem('Manual Topic');

      const res = await authPost('/time/sessions/manual')
        .send({
          learningItemId: item.id,
          startedAt: '2026-03-17T14:00:00.000Z',
          endedAt: '2026-03-17T15:00:00.000Z',
        })
        .expect(201);

      expect(res.body.learningItem.id).toBe(item.id);
    });

    it('returns 400 when endedAt is before startedAt', async () => {
      await authPost('/time/sessions/manual')
        .send({
          startedAt: '2026-03-17T15:00:00.000Z',
          endedAt: '2026-03-17T14:00:00.000Z',
        })
        .expect(400);
    });

    it('returns 400 when startedAt is not a valid ISO datetime', async () => {
      await authPost('/time/sessions/manual')
        .send({
          startedAt: 'not-a-date',
          endedAt: '2026-03-17T15:00:00.000Z',
        })
        .expect(400);
    });
  });

  // ── AC: Analytics show hours by day/week/month — sessions with date filter ──

  describe('get sessions with date filter', () => {
    it('returns all sessions when no filter is provided', async () => {
      // Create a manual session
      await authPost('/time/sessions/manual')
        .send({
          startedAt: '2026-03-17T09:00:00.000Z',
          endedAt: '2026-03-17T10:00:00.000Z',
        })
        .expect(201);

      const res = await authGet('/time/sessions').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('filters sessions by date range (from/to)', async () => {
      // Create sessions on different dates
      await authPost('/time/sessions/manual')
        .send({
          startedAt: '2026-03-15T09:00:00.000Z',
          endedAt: '2026-03-15T10:00:00.000Z',
        })
        .expect(201);

      await authPost('/time/sessions/manual')
        .send({
          startedAt: '2026-03-17T09:00:00.000Z',
          endedAt: '2026-03-17T10:00:00.000Z',
        })
        .expect(201);

      const res = await authGet(
        '/time/sessions?from=2026-03-16T00:00:00.000Z&to=2026-03-18T00:00:00.000Z',
      ).expect(200);

      expect(res.body.length).toBe(1);
    });

    it('returns active session via /active endpoint', async () => {
      // No active session
      const noActive = await authGet('/time/sessions/active').expect(200);
      expect(noActive.body).toBeNull();

      // Start one
      await authPost('/time/sessions/start').send({}).expect(201);

      const active = await authGet('/time/sessions/active').expect(200);
      expect(active.body).toBeTruthy();
      expect(active.body.endedAt).toBeNull();
    });
  });
});
