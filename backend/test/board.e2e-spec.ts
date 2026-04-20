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

  // ── AC: Drag updates per-day status only (item.status untouched) ──

  describe('PATCH /board/drag', () => {
    async function tomorrowStr(): Promise<string> {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 1);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    it('changes per-day status without touching the global item status', async () => {
      const item = await createItem('Drag Me');
      const today = todayStr();

      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: today })
        .expect(201);

      await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          date: today,
          newStatus: 'LEARNED',
        })
        .expect(200);

      // Today's board reflects new per-day status
      const boardRes = await authGet('/board/today').expect(200);
      expect(boardRes.body.columns.LEARNED.length).toBe(1);
      expect(boardRes.body.columns.LEARNED[0].title).toBe('Drag Me');

      // Global item status is unchanged (still TO_LEARN)
      const itemRes = await authGet(`/learning-items/${item.id}`).expect(200);
      expect(itemRes.body.status).toBe('TO_LEARN');
    });

    it('keeps each day independent: marking Done today leaves tomorrow as TO_LEARN', async () => {
      const item = await createItem('Multi-day Item');
      const today = todayStr();
      const tomorrow = await tomorrowStr();

      await authPost('/planning/assign-dates')
        .send({ learningItemId: item.id, dates: [today, tomorrow] })
        .expect(201);

      await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          date: today,
          newStatus: 'LEARNED',
        })
        .expect(200);

      const todayBoard = await authGet('/board/today').expect(200);
      expect(todayBoard.body.columns.LEARNED.length).toBe(1);
      expect(todayBoard.body.columns.TO_LEARN.length).toBe(0);

      const tomorrowBoard = await authGet(`/board/date/${tomorrow}`).expect(200);
      expect(tomorrowBoard.body.columns.TO_LEARN.length).toBe(1);
      expect(tomorrowBoard.body.columns.LEARNED.length).toBe(0);
    });

    it('optionally updates rank during drag', async () => {
      const item = await createItem('Ranked Item');
      const today = todayStr();

      await authPost('/planning/assign')
        .send({ learningItemId: item.id, level: 'DAILY', periodKey: today })
        .expect(201);

      await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          date: today,
          newStatus: 'PLANNED',
          newRank: 5,
        })
        .expect(200);

      const board = await authGet('/board/today').expect(200);
      expect(board.body.columns.PLANNED[0].rank).toBe(5);
    });

    it('returns 404 when no assignment exists for that date', async () => {
      const item = await createItem('Unassigned');
      await authPatch('/board/drag')
        .send({
          learningItemId: item.id,
          date: todayStr(),
          newStatus: 'IN_PROGRESS',
        })
        .expect(404);
    });
  });
});
