import request from 'supertest';
import { getApp, getAuthToken, cleanDb, closeApp, getPrisma } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Learning Items (e2e)', () => {
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
  const authDelete = (url: string) =>
    request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`);

  /** Helper: create a learning item and return the response body */
  async function createItem(overrides: Record<string, unknown> = {}) {
    const payload = {
      title: 'API test design techniques',
      description: 'Boundary value analysis and pairwise',
      priority: 'MEDIUM',
      difficulty: 3,
      estimatedHours: 4,
      tags: ['qa', 'api'],
      ...overrides,
    };
    const res = await authPost('/learning-items').send(payload).expect(201);
    return res.body;
  }

  // ── AC: User can create, edit, delete learning items ──

  describe('CRUD cycle', () => {
    it('creates a learning item with all fields', async () => {
      const item = await createItem();

      expect(item).toHaveProperty('id');
      expect(item.title).toBe('API test design techniques');
      expect(item.description).toBe('Boundary value analysis and pairwise');
      expect(item.priority).toBe('MEDIUM');
      expect(item.difficulty).toBe(3);
      expect(item.estimatedHours).toBe(4);
      expect(item.tags).toEqual(['qa', 'api']);
      expect(item.status).toBe('TO_LEARN');
    });

    it('gets a single learning item by ID', async () => {
      const created = await createItem();

      const res = await authGet(`/learning-items/${created.id}`).expect(200);

      expect(res.body.id).toBe(created.id);
      expect(res.body.title).toBe(created.title);
    });

    it('updates a learning item', async () => {
      const created = await createItem();

      const res = await authPatch(`/learning-items/${created.id}`)
        .send({ title: 'Updated Title', priority: 'HIGH' })
        .expect(200);

      expect(res.body.title).toBe('Updated Title');
      expect(res.body.priority).toBe('HIGH');
    });

    it('deletes a learning item', async () => {
      const created = await createItem();

      await authDelete(`/learning-items/${created.id}`).expect(204);

      // Verify it's gone
      await authGet(`/learning-items/${created.id}`).expect(404);
    });

    it('returns 404 for non-existent item', async () => {
      await authGet('/learning-items/clxxxxxxxxxxxxxxxxxxxxxxxxx').expect(404);
    });
  });

  // ── AC: Validation ──

  describe('validation', () => {
    it('returns 400 when title is missing', async () => {
      await authPost('/learning-items')
        .send({ description: 'no title' })
        .expect(400);
    });

    it('returns 400 when title is empty string', async () => {
      await authPost('/learning-items')
        .send({ title: '' })
        .expect(400);
    });

    it('returns 400 when difficulty is out of range', async () => {
      await authPost('/learning-items')
        .send({ title: 'Test', difficulty: 10 })
        .expect(400);
    });
  });

  // ── AC: List with filters (status, categoryId, search) ──

  describe('list and filters', () => {
    it('lists items with default pagination', async () => {
      await createItem({ title: 'Item A' });
      await createItem({ title: 'Item B' });

      const res = await authGet('/learning-items').expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body.data.length).toBe(2);
      expect(res.body.total).toBe(2);
    });

    it('filters by status', async () => {
      await createItem({ title: 'Todo item', status: 'TO_LEARN' });
      await createItem({ title: 'Done item', status: 'LEARNED' });

      const res = await authGet('/learning-items?status=LEARNED').expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('LEARNED');
    });

    it('filters by categoryId', async () => {
      // Create a category first
      const catRes = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Automation' })
        .expect(201);

      await createItem({ title: 'With category', categoryId: catRes.body.id });
      await createItem({ title: 'Without category' });

      const res = await authGet(`/learning-items?categoryId=${catRes.body.id}`).expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('With category');
    });

    it('filters by search (case-insensitive)', async () => {
      await createItem({ title: 'Playwright automation' });
      await createItem({ title: 'API testing basics' });

      const res = await authGet('/learning-items?search=playwright').expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Playwright automation');
    });

    it('paginates with limit and offset', async () => {
      await createItem({ title: 'Item 1' });
      await createItem({ title: 'Item 2' });
      await createItem({ title: 'Item 3' });

      const page1 = await authGet('/learning-items?limit=2&offset=0').expect(200);
      expect(page1.body.data.length).toBe(2);
      expect(page1.body.total).toBe(3);

      const page2 = await authGet('/learning-items?limit=2&offset=2').expect(200);
      expect(page2.body.data.length).toBe(1);
    });
  });

  // ── AC: Drag-and-drop between columns updates item status (move-status) ──

  describe('move status', () => {
    it('moves an item to a new status', async () => {
      const created = await createItem();

      const res = await authPost(`/learning-items/${created.id}/move-status`)
        .send({ status: 'IN_PROGRESS' })
        .expect(201);

      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('returns 404 when moving non-existent item', async () => {
      await authPost('/learning-items/clxxxxxxxxxxxxxxxxxxxxxxxxx/move-status')
        .send({ status: 'IN_PROGRESS' })
        .expect(404);
    });
  });

  // ── AC: Learning item with category relationship ──

  describe('category relationship', () => {
    it('creates an item with a category and includes it in response', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Theory' })
        .expect(201);

      const item = await createItem({
        title: 'With category',
        categoryId: catRes.body.id,
      });

      expect(item.category).toBeTruthy();
      expect(item.category.name).toBe('Theory');
    });
  });
});
