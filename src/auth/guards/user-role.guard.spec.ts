import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleGuard } from './user-role.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { META_DATA } from '../decorators/role-protected/role-protected.decorator';
import { ValidRoles } from '../enums/roles.enum';
import { User } from '../entities/users.entity';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

const createMockExecutionContext = (user?: any): ExecutionContext & { switchToHttp: () => HttpArgumentsHost } => ({
  getHandler: jest.fn(),
  getClass: jest.fn(),
  getType: jest.fn(),
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
  switchToHttp: () => ({
    getRequest: () => ({ user }),
    getResponse: jest.fn(),
    getNext: jest.fn(),
  }),
});

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<UserRoleGuard>(UserRoleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are specified', () => {
    const mockContext = createMockExecutionContext({
      roles: [{ name: ValidRoles.client }]
    });

    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should allow access when empty roles array is specified', () => {
    const mockContext = createMockExecutionContext({
      roles: [{ name: ValidRoles.client }]
    });

    jest.spyOn(reflector, 'get').mockReturnValue([]);

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should throw BadRequestException when user is not found in request', () => {
    const mockContext = createMockExecutionContext(null);

    jest.spyOn(reflector, 'get').mockReturnValue([ValidRoles.admin]);

    expect(() => guard.canActivate(mockContext)).toThrow(BadRequestException);
    expect(() => guard.canActivate(mockContext)).toThrow('User or roles not found');
  });

  it('should throw BadRequestException when user has no roles', () => {
    const mockContext = createMockExecutionContext({
      email: 'test@example.com',
      roles: null,
    });

    jest.spyOn(reflector, 'get').mockReturnValue([ValidRoles.admin]);

    expect(() => guard.canActivate(mockContext)).toThrow(BadRequestException);
    expect(() => guard.canActivate(mockContext)).toThrow('User or roles not found');
  });

  it('should allow access when user has valid role', () => {
    const mockUser = {
      email: 'admin@example.com',
      roles: [{ name: ValidRoles.admin }],
    } as User;

    const mockContext = createMockExecutionContext(mockUser);

    jest.spyOn(reflector, 'get').mockReturnValue([ValidRoles.admin]);

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user has no valid role', () => {
    const mockUser = {
      email: 'user@example.com',
      roles: [{ name: ValidRoles.client }],
    } as User;

    const mockContext = createMockExecutionContext(mockUser);

    jest.spyOn(reflector, 'get').mockReturnValue([ValidRoles.admin]);

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(mockContext)).toThrow(`User ${mockUser.email} needs a valid role`);
  });

  it('should handle multiple valid roles', () => {
    const mockUser = {
      email: 'user@example.com',
      roles: [{ name: ValidRoles.client }],
    } as User;

    const mockContext = createMockExecutionContext(mockUser);

    jest.spyOn(reflector, 'get').mockReturnValue([ValidRoles.admin, ValidRoles.client]);

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should handle user with multiple roles', () => {
    const mockUser = {
      email: 'user@example.com',
      roles: [
        { name: ValidRoles.client },
        { name: ValidRoles.admin }
      ],
    } as User;

    const mockContext = createMockExecutionContext(mockUser);

    jest.spyOn(reflector, 'get').mockReturnValue([ValidRoles.admin]);

    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
