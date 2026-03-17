import request from 'supertest';
import { getApp, getAuthToken, cleanDb, closeApp } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Categories (e2e)', () => {
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

  // ── AC: User can create, edit, delete categories ──

  it('GET /categories returns an array (empty after cleanup)', async () => {
    const res = await authGet('/categories').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /categories creates a new category', async () => {
    const res = await authPost('/categories')
      .send({ name: 'Automation', color: '#10B981', weightGoal: 40 })
      .expect(201);

    expect(res.body).toMatchObject({
      name: 'Automation',
      color: '#10B981',
      weightGoal: 40,
    });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('POST /categories with duplicate name returns 409', async () => {
    await authPost('/categories')
      .send({ name: 'Duplicate' })
      .expect(201);

    const res = await authPost('/categories')
      .send({ name: 'Duplicate' })
      .expect(409);

    expect(res.body.message).toMatch(/already exists/i);
  });

  it('POST /categories with missing name returns 400', async () => {
    await authPost('/categories')
      .send({ color: '#FF0000' })
      .expect(400);
  });

  it('PATCH /categories/:id updates a category', async () => {
    const created = await authPost('/categories')
      .send({ name: 'Old Name' })
      .expect(201);

    const res = await authPatch(`/categories/${created.body.id}`)
      .send({ name: 'New Name', color: '#0000FF' })
      .expect(200);

    expect(res.body.name).toBe('New Name');
    expect(res.body.color).toBe('#0000FF');
  });

  it('PATCH /categories/:id with non-existent ID returns 404', async () => {
    await authPatch('/categories/clxxxxxxxxxxxxxxxxxxxxxxxxx')
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('DELETE /categories/:id removes a category', async () => {
    const created = await authPost('/categories')
      .send({ name: 'Temp' })
      .expect(201);

    await authDelete(`/categories/${created.body.id}`).expect(204);

    // Verify it's gone
    const list = await authGet('/categories').expect(200);
    const ids = list.body.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(created.body.id);
  });

  it('DELETE /categories/:id with non-existent ID returns 404', async () => {
    await authDelete('/categories/clxxxxxxxxxxxxxxxxxxxxxxxxx').expect(404);
  });

  // ── AC: Category-based progress — categories have optional target weight ──

  it('creates a category with weightGoal for target distribution', async () => {
    const res = await authPost('/categories')
      .send({ name: 'Theory', weightGoal: 30 })
      .expect(201);

    expect(res.body.weightGoal).toBe(30);
  });
});
