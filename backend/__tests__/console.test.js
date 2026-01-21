const express = require('express');
const request = require('supertest');
const consoleRouter = require('../routes/console');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/', consoleRouter);
  return app;
}

describe('AI Console Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/ai-console/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/ai-console/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          status: 'online',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('POST /api/ai-console/analyze', () => {
    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .post('/api/ai-console/analyze')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: 'Code is required'
        })
      );
    });

    it('should return analysis when code is provided', async () => {
      const response = await request(app)
        .post('/api/ai-console/analyze')
        .send({
          code: 'def hello():\n    print("Hello")',
          language: 'python'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          analysis: expect.any(Object)
        })
      );
    });
  });

  describe('POST /api/ai-console/personality', () => {
    it('should return 400 for invalid personality', async () => {
      const response = await request(app)
        .post('/api/ai-console/personality')
        .send({ personality: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: 'Invalid personality'
        })
      );
    });

    it('should set personality successfully', async () => {
      const response = await request(app)
        .post('/api/ai-console/personality')
        .send({ personality: 'encouraging' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          personality: 'encouraging'
        })
      );
    });
  });

  describe('POST /api/ai-console/context', () => {
    it('should return 400 for invalid context key', async () => {
      const response = await request(app)
        .post('/api/ai-console/context')
        .send({ key: 'invalid_key', value: 'test' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('Invalid context key')
        })
      );
    });

    it('should set context successfully', async () => {
      const response = await request(app)
        .post('/api/ai-console/context')
        .send({ key: 'language', value: 'javascript' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          context: expect.objectContaining({
            language: 'javascript'
          })
        })
      );
    });
  });

  describe('GET /api/ai-console/context', () => {
    it('should return current context', async () => {
      const response = await request(app)
        .get('/api/ai-console/context');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          context: expect.any(Object),
          personality: expect.any(String)
        })
      );
    });
  });
});
