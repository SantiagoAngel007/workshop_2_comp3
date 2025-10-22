import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UserRoleGuard } from './user-role.guard';
import { User } from '../entities/users.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;
  let reflector: Reflector;

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: null,
      }),
    }),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<UserRoleGuard>(UserRoleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    it('should return true if no roles are defined', async () => {
      mockReflector.get.mockReturnValue([]);
      const result = await guard.canActivate(mockContext as any);
      expect(result).toBe(true);
    });

    it('should throw BadRequestException if user or roles are not found', async () => {
      mockReflector.get.mockReturnValue(['admin']);
      mockContext.switchToHttp().getRequest.mockReturnValue({ user: null });

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(BadRequestException);
    });

    it('should return true if user has a valid role', async () => {
      mockReflector.get.mockReturnValue(['admin']);
      const user = { roles: [{ name: 'admin' }] };
      mockContext.switchToHttp().getRequest.mockReturnValue({ user });

      const result = await guard.canActivate(mockContext as any);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not have a valid role', async () => {
      mockReflector.get.mockReturnValue(['admin']);
      const user = { roles: [{ name: 'client' }] };
      mockContext.switchToHttp().getRequest.mockReturnValue({ user });

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(ForbiddenException);
    });
  });
});