import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/auth/entities/users.entity';
import { Role } from '../src/auth/entities/roles.entity';
import { Repository } from 'typeorm';
import { ValidRoles } from '../src/auth/enums/roles.enum';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    roleRepository = moduleFixture.get<Repository<Role>>(
      getRepositoryToken(Role),
    );

    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    await userRepository.clear();
    await roleRepository.clear();

    // Create default roles
    const clientRole = roleRepository.create({ name: ValidRoles.client });
    const adminRole = roleRepository.create({ name: ValidRoles.admin });
    await roleRepository.save([clientRole, adminRole]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe(createUserDto.email);
          expect(res.body.user.fullName).toBe(createUserDto.fullName);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email', () => {
      const createUserDto = {
        email: 'invalid-email',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      const createUserDto = {
        email: 'test@example.com',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      // First registration should succeed
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(201);

      // Second registration with same email should fail
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      const clientRole = await roleRepository.findOne({
        where: { name: ValidRoles.client },
      });
      const hashedPassword = bcrypt.hashSync('password123', 10);

      const user = userRepository.create({
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: hashedPassword,
        isActive: true,
        roles: [clientRole],
      });

      await userRepository.save(user);
    });

    it('should login successfully with valid credentials', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe(loginDto.email);
        });
    });

    it('should fail with invalid email', () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should fail with invalid password', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/auth (GET)', () => {
    it('should return all users', async () => {
      // Create test users
      const clientRole = await roleRepository.findOne({
        where: { name: ValidRoles.client },
      });
      const users = [
        userRepository.create({
          email: 'user1@example.com',
          fullName: 'User One',
          age: 25,
          password: 'hashedpassword',
          roles: [clientRole],
        }),
        userRepository.create({
          email: 'user2@example.com',
          fullName: 'User Two',
          age: 30,
          password: 'hashedpassword',
          roles: [clientRole],
        }),
      ];

      await userRepository.save(users);

      return request(app.getHttpServer())
        .get('/auth')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });
  });

  describe('/auth/:id (GET)', () => {
    it('should return user by id', async () => {
      const clientRole = await roleRepository.findOne({
        where: { name: ValidRoles.client },
      });
      const user = userRepository.create({
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'hashedpassword',
        roles: [clientRole],
      });

      const savedUser = await userRepository.save(user);

      return request(app.getHttpServer())
        .get(`/auth/${savedUser.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(savedUser.id);
          expect(res.body.email).toBe(savedUser.email);
        });
    });

    it('should return 404 for non-existent user', () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .get(`/auth/${nonExistentId}`)
        .expect(404);
    });
  });
});
