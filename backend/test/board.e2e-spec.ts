import request from 'supertest';
import { getApp, getAuthToken, cleanDb, closeApp } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Board (e2e)', () => {
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
  async function createItem(title = 'Board Item') {
    const res = await authPost('/learning-items')
      .send({ title })
      .expect(201);
    return res.body;
  }

  /** Get today's date as YYYY-MM-DD (UTC). */
  function todayStr(): string {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ── AC: Board reflects current day/week scope ──

  describe('GET /board/today', () => {
    it('returns columns structure with board statuses', async () => {
      const res = await authGet('/board/today').expect(200);

      expect(res.body).toHaveProperty('columns');
      expect(res.body).toHaveProperty('date');

      const columns = res.body.columns;
      expect(columns).toHaveProperty('TO_LEARN');
      expect(columns).toHaveProperty('PLANNED');
      expect(columns).toHaveProperty('IN_PROGRESS');
      expect(columns).toHaveProperty('LEARNED');
      expect(columns).toHaveProperty('NEEDS_REVISION');
    });

    it('returns items assigned to today in the correct column', async () => {
      const item = await createItem('Today Item');
      const today = todayStr();

      // Assign to today
      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: today })
        .expect(201);

      const res = await authGet('/board/today').expect(200);

      // Item should be in TO_LEARN column (default status)
      expect(res.body.columns.TO_LEARN.length).toBe(1);
      expect(res.body.columns.TO_LEARN[0].title).toBe('Today Item');
    });
  });

  describe('GET /board/week', () => {
    it('returns columns and weekDates', async () => {
      const res = await authGet('/board/week').expect(200);

      expect(res.body).toHaveProperty('columns');
      expect(res.body).toHaveProperty('weekDates');
      expect(Array.isArray(res.body.weekDates)).toBe(true);
      expect(res.body.weekDates.length).toBe(5); // Mon-Fri
    });
  });

  // ── AC: Drag-and-drop between columns updates item status ──

  describe('PATCH /board/drag', () => {
    it('changes the item status when dragged to a new column', async () => {
      const item = await createItem('Drag Me');

      const res = await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          newStatus: 'IN_PROGRESS',
        })
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');

      // Verify the item is actually updated
      const itemRes = await authGet(`/learning-items/${item.id}`).expect(200);
      expect(itemRes.body.status).toBe('IN_PROGRESS');
    });

    it('changes status to LEARNED', async () => {
      const item = await createItem('Learn Me');

      const res = await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          newStatus: 'LEARNED',
        })
        .expect(200);

      expect(res.body.status).toBe('LEARNED');
    });

    it('optionally updates rank during drag', async () => {
      const item = await createItem('Ranked Item');
      const today = todayStr();

      // Assign to today so there's a plan assignment to update
      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: today })
        .expect(201);

      const res = await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          newStatus: 'PLANNED',
          newRank: 5,
        })
        .expect(200);

      expect(res.body.status).toBe('PLANNED');
    });

    it('returns 404 when dragging non-existent item', async () => {
      await authPatch('/board/drag')
        .send({
          learningItemId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          newStatus: 'IN_PROGRESS',
        })
        .expect(404);
    });
  });
});
