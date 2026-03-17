import request from 'supertest';
import { getApp, getAuthToken, closeApp } from './setup';

import type { INestApplication } from '@nestjs/common';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  // ── AC: Single-user auth with APP_SECRET ──

  it('returns 200 and an accessToken when password is correct', async () => {
    const appSecret = process.env.APP_SECRET || 'test-secret';

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: appSecret })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);
  });

  it('returns 401 when password is wrong', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: 'absolutely-wrong-password' })
      .expect(401);

    expect(res.body.message).toMatch(/invalid password/i);
  });

  it('returns 400 when password field is missing', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(400);
  });

  // ── AC: Protected endpoints require valid JWT ──

  it('returns 401 when accessing a protected endpoint without a token', async () => {
    await request(app.getHttpServer())
      .get('/categories')
      .expect(401);
  });

  it('returns 401 when accessing a protected endpoint with an invalid token', async () => {
    await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .expect(401);
  });

  it('returns 200 when accessing a protected endpoint with a valid token', async () => {
    const token = await getAuthToken();

    const res = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
