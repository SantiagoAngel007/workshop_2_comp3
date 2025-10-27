import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/auth/entities/users.entity';
import { Role } from '../src/auth/entities/roles.entity';
import { Subscription } from '../src/subscriptions/entities/subscription.entity';
import { Membership } from '../src/memberships/entities/membership.entity';
import { Repository } from 'typeorm';
import { ValidRoles } from '../src/auth/enums/roles.enum';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let subscriptionRepository: Repository<Subscription>;
  let membershipRepository: Repository<Membership>;
  let jwtService: JwtService;
  let adminToken: string;
  let clientToken: string;
  let testUser: User;
  let testAdmin: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = moduleFixture.get<Repository<Role>>(getRepositoryToken(Role));
    subscriptionRepository = moduleFixture.get<Repository<Subscription>>(getRepositoryToken(Subscription));
    membershipRepository = moduleFixture.get<Repository<Membership>>(getRepositoryToken(Membership));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean database
    await subscriptionRepository.clear();
    await membershipRepository.clear();
    await userRepository.clear();
    await roleRepository.clear();

    // Create roles
    const clientRole = roleRepository.create({ name: ValidRoles.client });
    const adminRole = roleRepository.create({ name: ValidRoles.admin });
    const receptionistRole = roleRepository.create({ name: ValidRoles.receptionist });
    await roleRepository.save([clientRole, adminRole, receptionistRole]);

    // Create test users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    testUser = userRepository.create({
      email: 'client@example.com',
      fullName: 'Test Client',
      age: 25,
      password: hashedPassword,
      isActive: true,
      roles: [clientRole],
    });
    
    testAdmin = userRepository.create({
      email: 'admin@example.com',
      fullName: 'Test Admin',
      age: 30,
      password: hashedPassword,
      isActive: true,
      roles: [adminRole],
    });

    await userRepository.save([testUser, testAdmin]);

    // Generate tokens
    clientToken = jwtService.sign({ id: testUser.id });
    adminToken = jwtService.sign({ id: testAdmin.id });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/subscriptions (POST)', () => {
    it('should create subscription for user with admin token', () => {
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: testUser.id })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toContain(testUser.fullName);
          expect(res.body.user.id).toBe(testUser.id);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/subscriptions')
        .send({ userId: testUser.id })
        .expect(401);
    });

    it('should fail with client token', () => {
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ userId: testUser.id })
        .expect(403);
    });

    it('should fail with non-existent user', () => {
      const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174000';
      
      return request(app.getHttpServer())
        .post('/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: nonExistentUserId })
        .expect(404);
    });
  });

  describe('/subscriptions/user/:userId (GET)', () => {
    beforeEach(async () => {
      // Create a subscription for the test user
      const subscription = subscriptionRepository.create({
        name: `Subscription for ${testUser.fullName}`,
        cost: 50,
        max_classes_assistance: 10,
        max_gym_assistance: 30,
        duration_months: 1,
        purchase_date: new Date(),
        user: testUser,
      });
      await subscriptionRepository.save(subscription);
    });

    it('should get subscription by user id with admin token', () => {
      return request(app.getHttpServer())
        .get(`/subscriptions/user/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.user.id).toBe(testUser.id);
          expect(res.body.name).toContain(testUser.fullName);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/subscriptions/user/${testUser.id}`)
        .expect(401);
    });

    it('should fail with client token', () => {
      return request(app.getHttpServer())
        .get(`/subscriptions/user/${testUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('/subscriptions/:id/memberships (POST)', () => {
    let subscription: Subscription;
    let membership: Membership;

    beforeEach(async () => {
      // Create subscription and membership
      subscription = subscriptionRepository.create({
        name: `Subscription for ${testUser.fullName}`,
        cost: 50,
        max_classes_assistance: 10,
        max_gym_assistance: 30,
        duration_months: 1,
        purchase_date: new Date(),
        user: testUser,
      });
      await subscriptionRepository.save(subscription);

      membership = membershipRepository.create({
        name: 'Basic Membership',
        cost: 25,
        status: true,
        max_classes_assistance: 5,
        max_gym_assistance: 15,
        duration_months: 1,
      });
      await membershipRepository.save(membership);
    });

    it('should add membership to subscription with admin token', () => {
      return request(app.getHttpServer())
        .post(`/subscriptions/${subscription.id}/memberships`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ membershipId: membership.id })
        .expect(201)
        .expect((res) => {
          expect(res.body.memberships).toHaveLength(1);
          expect(res.body.memberships[0].id).toBe(membership.id);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/subscriptions/${subscription.id}/memberships`)
        .send({ membershipId: membership.id })
        .expect(401);
    });

    it('should fail with non-existent membership', () => {
      const nonExistentMembershipId = '123e4567-e89b-12d3-a456-426614174000';
      
      return request(app.getHttpServer())
        .post(`/subscriptions/${subscription.id}/memberships`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ membershipId: nonExistentMembershipId })
        .expect(404);
    });
  });

  describe('/subscriptions (GET)', () => {
    beforeEach(async () => {
      // Create test subscriptions
      const subscriptions = [
        subscriptionRepository.create({
          name: 'Subscription 1',
          cost: 50,
          max_classes_assistance: 10,
          max_gym_assistance: 30,
          duration_months: 1,
          purchase_date: new Date(),
          user: testUser,
        }),
        subscriptionRepository.create({
          name: 'Subscription 2',
          cost: 75,
          max_classes_assistance: 15,
          max_gym_assistance: 45,
          duration_months: 2,
          purchase_date: new Date(),
          user: testAdmin,
        }),
      ];
      await subscriptionRepository.save(subscriptions);
    });

    it('should get all subscriptions with admin token', () => {
      return request(app.getHttpServer())
        .get('/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/subscriptions')
        .expect(401);
    });

    it('should fail with client token', () => {
      return request(app.getHttpServer())
        .get('/subscriptions')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('/subscriptions/:id (GET)', () => {
    let subscription: Subscription;

    beforeEach(async () => {
      subscription = subscriptionRepository.create({
        name: `Subscription for ${testUser.fullName}`,
        cost: 50,
        max_classes_assistance: 10,
        max_gym_assistance: 30,
        duration_months: 1,
        purchase_date: new Date(),
        user: testUser,
      });
      await subscriptionRepository.save(subscription);
    });

    it('should get subscription by id with admin token', () => {
      return request(app.getHttpServer())
        .get(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(subscription.id);
          expect(res.body.name).toBe(subscription.name);
        });
    });

    it('should get subscription by id with client token', () => {
      return request(app.getHttpServer())
        .get(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/subscriptions/${subscription.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent subscription', () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      
      return request(app.getHttpServer())
        .get(`/subscriptions/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/subscriptions/:id (PATCH)', () => {
    let subscription: Subscription;

    beforeEach(async () => {
      subscription = subscriptionRepository.create({
        name: `Subscription for ${testUser.fullName}`,
        cost: 50,
        max_classes_assistance: 10,
        max_gym_assistance: 30,
        duration_months: 1,
        purchase_date: new Date(),
        user: testUser,
      });
      await subscriptionRepository.save(subscription);
    });

    it('should update subscription with admin token', () => {
      const updateData = {
        name: 'Updated Subscription',
        cost: 75,
      };

      return request(app.getHttpServer())
        .patch(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.cost).toBe(updateData.cost);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/subscriptions/${subscription.id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should fail with client token', () => {
      return request(app.getHttpServer())
        .patch(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Updated' })
        .expect(403);
    });
  });

  describe('/subscriptions/:id (DELETE)', () => {
    let subscription: Subscription;

    beforeEach(async () => {
      subscription = subscriptionRepository.create({
        name: `Subscription for ${testUser.fullName}`,
        cost: 50,
        max_classes_assistance: 10,
        max_gym_assistance: 30,
        duration_months: 1,
        purchase_date: new Date(),
        user: testUser,
      });
      await subscriptionRepository.save(subscription);
    });

    it('should delete subscription with admin token', () => {
      return request(app.getHttpServer())
        .delete(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/subscriptions/${subscription.id}`)
        .expect(401);
    });

    it('should fail with client token', () => {
      return request(app.getHttpServer())
        .delete(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });
});
