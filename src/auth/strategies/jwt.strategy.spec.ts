import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { createMockRepository } from '../../../test/utils/test-utils';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user', async () => {
    const payload = { id: 'user-123' };
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      isActive: true,
      roles: [],
    };

    userRepository.findOne.mockResolvedValue(mockUser);

    const result = await strategy.validate(payload);
    expect(result).toEqual(mockUser);
  });

  it('should throw UnauthorizedException for invalid user', async () => {
    const payload = { id: 'invalid-user' };
    userRepository.findOne.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
