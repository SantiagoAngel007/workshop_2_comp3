import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/ (GET)', () => {
    it('should return "Hello World!"', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200);
    });
  });

  describe('API Routes', () => {
    it('should have auth routes available', () => {
      return request(app.getHttpServer())
        .get('/auth')
        .expect((res) => {
          // Should return 200 or 401 (if auth required), not 404
          expect([200, 401, 403].includes(res.status)).toBe(true);
        });
    });

    it('should have subscriptions routes available', () => {
      return request(app.getHttpServer())
        .get('/subscriptions')
        .expect((res) => {
          // Should return 200 or 401 (if auth required), not 404
          expect([200, 401, 403].includes(res.status)).toBe(true);
        });
    });

    it('should have memberships routes available', () => {
      return request(app.getHttpServer())
        .get('/memberships')
        .expect((res) => {
          // Should return 200 or 401 (if auth required), not 404
          expect([200, 401, 403].includes(res.status)).toBe(true);
        });
    });

    it('should have users routes available', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect((res) => {
          // Should return 200 or 401 (if auth required), not 404
          expect([200, 401, 403].includes(res.status)).toBe(true);
        });
    });

    it('should have attendances routes available', () => {
      return request(app.getHttpServer())
        .get('/attendances')
        .expect((res) => {
          // Should return 200 or 401 (if auth required), not 404
          expect([200, 401, 403].includes(res.status)).toBe(true);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });
  });
});
