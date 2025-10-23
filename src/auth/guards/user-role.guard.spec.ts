import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UserRoleGuard } from './user-role.guard';
import { BadRequestException, ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;

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
  });

  describe('canActivate', () => {
    it('should return true if no roles are defined', async () => {
      mockReflector.get.mockReturnValue([]);
      const result = await guard.canActivate(mockContext as unknown as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw BadRequestException if user or roles are not found', async () => {
      mockReflector.get.mockReturnValue(['admin']);
      mockContext.switchToHttp().getRequest.mockReturnValue({ user: null });

      await expect(guard.canActivate(mockContext as unknown as ExecutionContext)).rejects.toThrow(BadRequestException);
    });

    it('should return true if user has a valid role', async () => {
      mockReflector.get.mockReturnValue(['admin']);
      const user = { roles: [{ name: 'admin' }] };
      mockContext.switchToHttp().getRequest.mockReturnValue({ user });

      const result = await guard.canActivate(mockContext as unknown as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not have a valid role', async () => {
      mockReflector.get.mockReturnValue(['admin']);
      const user = { roles: [{ name: 'client' }], email: 'test@test.com' };
      mockContext.switchToHttp().getRequest.mockReturnValue({ user });

      await expect(guard.canActivate(mockContext as unknown as ExecutionContext)).rejects.toThrow(ForbiddenException);
    });
  });
});