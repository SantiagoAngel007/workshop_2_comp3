import { Repository } from 'typeorm';

export const createMockRepository = <T = any>(): Partial<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  count: jest.fn(),
  findByIds: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
});

export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  fullName: 'Test User',
  age: 25,
  password: 'hashedPassword',
  isActive: true,
  roles: [],
  subscriptions: [],
  attendances: [],
};

export const mockRole = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'client',
  users: [],
};

export const mockMembership = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  name: 'Basic Membership',
  cost: 50.0,
  status: true,
  max_classes_assistance: 10,
  max_gym_assistance: 30,
  duration_months: 1,
  created_at: new Date(),
  updated_at: new Date(),
  Subscription: [],
};

export const mockSubscription = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  name: 'Basic Subscription',
  cost: 50.0,
  max_classes_assistance: 10,
  max_gym_assistance: 30,
  duration_months: 1,
  purchase_date: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  user: mockUser,
  memberships: [mockMembership],
  isActive: true,
};

export const mockAttendance = {
  id: '123e4567-e89b-12d3-a456-426614174004',
  user: mockUser,
  type: 'gym',
  checkIn: new Date(),
  checkOut: null,
  created_at: new Date(),
  updated_at: new Date(),
};
