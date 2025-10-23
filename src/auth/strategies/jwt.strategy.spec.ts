import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../entities/users.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Jwt } from '../interfaces/jwt.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 'uuid1',
    email: 'test@example.com',
    isActive: true,
    roles: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('validate', () => {
    it('should return user if token is valid and user is active', async () => {
      const payload: Jwt = { id: 'uuid1', email: 'test@example.com' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid1' },
        relations: ['roles'],
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload: Jwt = { id: 'uuid1', email: 'test@example.com' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const payload: Jwt = { id: 'uuid1', email: 'test@example.com' };
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser as User);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});