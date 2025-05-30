import { jest } from '@jest/globals';
import request from 'supertest';

// Mock db.js for all tests using ES module mocking
const mockQuery = jest.fn((text, params) => {
  if (text.includes('SELECT')) {
    if (text.includes('WHERE id = $1')) {
      if (params[0] === '1' || params[0] === 1) {
        return Promise.resolve({ rows: [{ id: 1, name: 'Test', email: 'test@example.com' }] });
      } else {
        return Promise.resolve({ rows: [] });
      }
    }
    return Promise.resolve({ rows: [{ id: 1, name: 'Test', email: 'test@example.com' }] });
  }
  if (text.includes('INSERT')) {
    return Promise.resolve({ rows: [{ id: 2, name: params[0], email: params[1] }] });
  }
  if (text.includes('UPDATE')) {
    if (params[2] === '999' || params[2] === 999) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [{ id: params[2], name: params[0], email: params[1] }] });
  }
  if (text.includes('DELETE')) {
    if (params[0] === '999' || params[0] === 999) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [{ id: params[0], name: 'Deleted', email: 'deleted@example.com' }] });
  }
  return Promise.resolve({ rows: [] });
});

jest.unstable_mockModule('../db.js', () => ({
  query: mockQuery
}));

let app;
beforeAll(async () => {
  // Dynamically import app after mocking db.js
  const mod = await import('../app.js');
  app = mod.default;
});

describe('API routes', () => {
  test('GET /ping returns pong', async () => {
    const res = await request(app).get('/ping');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('pong');
  });

  test('GET /api/users returns list of users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('email');
    expect(res.body[0]).toHaveProperty('name');
  });

  test('GET /api/users/:id returns a user', async () => {
    const res = await request(app).get('/api/users/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
  });

  test('GET /api/users/:id returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.statusCode).toBe(404);
  });

  test('POST /api/users adds a user', async () => {
    const userData = { name: 'Alice', email: 'alice@example.com' };
    const res = await request(app)
      .post('/api/users')
      .send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject(userData);
    expect(res.body).toHaveProperty('id');
  });

  test('POST /api/users with invalid data returns 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Invalid' }); // Missing email
    expect(res.statusCode).toBe(400);
  });

  test('PUT /api/users/:id updates a user', async () => {
    const userData = { name: 'Bob', email: 'bob@example.com' };
    const res = await request(app)
      .put('/api/users/1')
      .send(userData);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(userData);
    expect(res.body).toHaveProperty('id', '1');
  });

  test('PUT /api/users/:id returns 404 for non-existent user', async () => {
    const userData = { name: 'Bob', email: 'bob@example.com' };
    const res = await request(app)
      .put('/api/users/999')
      .send(userData);
    expect(res.statusCode).toBe(404);
  });

  test('PUT /api/users/:id with invalid data returns 400', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .send({ name: 'Invalid' }); // Missing email
    expect(res.statusCode).toBe(400);
  });

  test('DELETE /api/users/:id deletes a user', async () => {
    const res = await request(app).delete('/api/users/1');
    expect(res.statusCode).toBe(204);
  });

  test('DELETE /api/users/:id returns 404 for non-existent user', async () => {
    const res = await request(app).delete('/api/users/999');
    expect(res.statusCode).toBe(404);
  });

  test('GET /api/users handles DB error', async () => {
    mockQuery.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/users/:id handles DB error', async () => {
    mockQuery.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/users/1');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/users handles DB error', async () => {
    mockQuery.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test@example.com' });
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('PUT /api/users/:id handles DB error', async () => {
    mockQuery.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app)
      .put('/api/users/1')
      .send({ name: 'Test', email: 'test@example.com' });
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('DELETE /api/users/:id handles DB error', async () => {
    mockQuery.mockImplementationOnce(() => { throw new Error('DB error'); });
    const res = await request(app).delete('/api/users/1');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
