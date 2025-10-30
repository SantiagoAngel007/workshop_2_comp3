/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/users.entity';
import { Role } from './entities/roles.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { createMockRepository, mockRole } from '../../test/utils/test-utils';
import {
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ValidRoles } from './enums/roles.enum';
import { Jwt } from './interfaces/jwt.interface';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import * as bcrypt from 'bcryptjs';

// Use manual mock from __mocks__/bcryptjs.js
jest.mock('bcryptjs');

// Create a full mock User instance that matches the entity class

const mockAuthUser = {
  id: 'test-auth-123',
  email: 'auth@example.com',
  fullName: 'Auth Test User',
  age: 25,
  password: 'hashedPassword123',
  isActive: true,
  roles: [],
  subscriptions: [],
  attendances: [],
  checkFieldsBeforeChanges: jest.fn(),
} as User;

// Prepare auth user with admin role
const mockAuthUserAdmin = {
  ...mockAuthUser,
  roles: [{ name: ValidRoles.admin }],
} as User;

describe('AuthService', () => {
  // Create mock users with required entity methods
  // Base mock user instance with required methods
  const mockTestUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    age: 25,
    password: 'hashedPassword123',
    isActive: true,
    roles: [],
    subscriptions: [],
    attendances: [],
    checkFieldsBeforeChanges: jest.fn(),
  } as User;

  // Admin user for auth checks
  const mockAdminUser = {
    ...mockTestUser,
    id: 'admin-user-123',
    email: 'admin@example.com',
    roles: [{ id: 'admin-role-id', name: ValidRoles.admin, users: [] }],
    checkFieldsBeforeChanges: jest.fn(),
  } as User;

  // Regular user for testing
  const mockRegularUser = {
    ...mockTestUser,
    id: 'regular-user-123',
    email: 'regular@example.com',
    roles: [{ id: 'client-role-id', name: ValidRoles.client, users: [] }],
    checkFieldsBeforeChanges: jest.fn(),
  } as User;
  let service: AuthService;
  let userRepository: any;
  let roleRepository: any;
  let jwtService: JwtService;
  let subscriptionsService: SubscriptionsService;

  beforeEach(async () => {
    // Reset bcrypt mocks to default behavior before each test
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedPassword123');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Role),
          useValue: createMockRepository(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation(() => 'jwt-token'),
          } as unknown as JwtService,
        },
        {
          provide: SubscriptionsService,
          useValue: {
            createSubscriptionForUser: jest.fn().mockImplementation(() =>
              Promise.resolve({
                id: 'test-subscription-123',
                isActive: true,
                created_at: new Date(),
                updated_at: new Date(),
              } as Subscription),
            ),
            findSubscriptionByUserId: jest.fn(),
            hasActiveSubscription: jest.fn(),
            addMembershipToSubscription: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          } as unknown as SubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    jwtService = module.get(JwtService);
    subscriptionsService = module.get(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword';
      const defaultRole = { ...mockRole, name: ValidRoles.client };
      const savedUser = { ...mockTestUser, roles: [defaultRole] };

      (bcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      roleRepository.findOneBy.mockResolvedValue(defaultRole);
      userRepository.create.mockReturnValue({
        ...createUserDto,
        password: hashedPassword,
      });
      userRepository.save.mockResolvedValue(savedUser);
      jest
        .spyOn(subscriptionsService, 'createSubscriptionForUser')
        .mockImplementation(() =>
          Promise.resolve({
            id: 'test-subscription-123',
            isActive: true,
            created_at: new Date(),
            updated_at: new Date(),
          } as Subscription),
        );

      const result = await service.create(createUserDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('jwt-token');
    });

    it('should throw InternalServerErrorException if subscription creation fails', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword';
      const defaultRole = { ...mockRole, name: ValidRoles.client };
      const savedUser = { ...mockTestUser, roles: [defaultRole] };

      (bcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      roleRepository.findOneBy.mockResolvedValue(defaultRole);
      userRepository.create.mockReturnValue({
        ...createUserDto,
        password: hashedPassword,
      });
      userRepository.save.mockResolvedValue(savedUser);
      jest
        .spyOn(subscriptionsService, 'createSubscriptionForUser')
        .mockImplementation(() =>
          Promise.reject(new Error('Subscription creation failed')),
        );

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if default role not found', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      roleRepository.findOneBy.mockResolvedValue(null);
      userRepository.create.mockReturnValue(createUserDto);

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle duplicate email error during user creation', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      const defaultRole = { ...mockRole, name: ValidRoles.client };
      roleRepository.findOneBy.mockResolvedValue(defaultRole);
      userRepository.create.mockReturnValue(createUserDto);

      // Simulate PostgreSQL unique constraint violation error
      const error = new Error('Duplicate email');
      (error as any).code = '23505';
      (error as any).detail = 'Email already exists';
      userRepository.save.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should handle unexpected database errors during user creation', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      const defaultRole = { ...mockRole, name: ValidRoles.client };
      roleRepository.findOneBy.mockResolvedValue(defaultRole);
      userRepository.create.mockReturnValue(createUserDto);
      userRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Unexpected error, check server logs',
      );
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = { ...mockTestUser, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'jwt-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('jwt-token');
      expect(result.email).toBe(loginDto.email);
    });

    it('should throw NotFoundException for invalid email', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = { ...mockTestUser, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should login inactive user (no validation in current implementation)', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        ...mockTestUser,
        isActive: false,
        password: 'hashedPassword',
      };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'jwt-token');

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('token');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ ...mockTestUser }];
      // No se debe incluir la contraseña en la respuesta
      const usersWithoutPassword = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      userRepository.find.mockResolvedValue(usersWithoutPassword);

      const result = await service.findAll();

      expect(result).toEqual(usersWithoutPassword);
      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['roles'],
      });
    });

    it('should handle error when finding all users', async () => {
      userRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockTestUser);

      const result = await service.findOne('123');

      expect(result).toEqual(mockTestUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto = { fullName: 'Updated Name' };
      const userId = '123';
      const authUser = { ...mockAdminUser } as User;

      // Simula el usuario existente antes de la actualización
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User', // Nombre antes de la actualización
        age: 25,
        password: 'hashedPassword',
        isActive: true,
        roles: [{ name: ValidRoles.admin }],
        subscriptions: [],
        attendances: [],
      };

      // Simula el usuario después de la actualización
      const updatedUser = {
        ...existingUser, // Copia todas las propiedades
        fullName: 'Updated Name', // Aplica la actualización
      };

      // Mock para findOne: debe devolver el usuario existente antes de la actualización
      userRepository.findOne.mockResolvedValueOnce(existingUser);
      // Mock para findOne después de la actualización: debe devolver el usuario actualizado
      userRepository.findOne.mockResolvedValueOnce(updatedUser);

      // Mock para update: debe indicar que la actualización fue exitosa
      userRepository.update.mockResolvedValue({ affected: 1 });

      // Mock para findOne después de la actualización: debe devolver el usuario actualizado
      userRepository.findOne.mockResolvedValueOnce(updatedUser);

      const result = await service.update(userId, updateUserDto, authUser);

      // Verifica que se haya llamado findOne con los argumentos correctos
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['roles'], // Asegúrate de que el servicio lo llama así
      });

      // Verifica que se haya llamado save con el objeto usuario modificado
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        fullName: 'Updated Name',
      });

      // Verifica el resultado del servicio
      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserDto = { fullName: 'Updated Name' };
      const authUser = { ...mockAdminUser } as User;
      const userId = '123';

      // Mock para findOne: simula que no encuentra el usuario
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, updateUserDto, authUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should hash password if provided in update', async () => {
      const updateUserDto = { password: 'newpassword' };
      const userId = mockTestUser.id;
      const existingUser = { ...mockTestUser, password: 'oldHashedPassword' };
      const authUser = { ...mockTestUser, roles: [{ name: ValidRoles.admin }] };
      const newHashedPassword = 'newHashedPassword';

      userRepository.findOne.mockResolvedValue(existingUser);
      // Mock para bcrypt.hashSync
      (bcrypt.hashSync as jest.Mock).mockReturnValue(newHashedPassword);
      // Mock para save: simula el guardado con la nueva contraseña hasheada
      userRepository.save.mockResolvedValue({
        ...existingUser,
        password: newHashedPassword,
      });

      await service.update(userId, updateUserDto, authUser);

      // Verifica que bcrypt.hashSync se haya llamado con la nueva contraseña
      expect(bcrypt.hashSync).toHaveBeenCalledWith('newpassword', 10);

      // Verifica que save se haya llamado con el usuario actualizado
      expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, {
        password: newHashedPassword,
      });
    });
  });

  describe('update - additional branch coverage', () => {
    it('should throw ForbiddenException when non-admin tries to update other user', async () => {
      const updateUserDto = { fullName: 'Updated Name' };
      const userToUpdate = { ...mockTestUser, id: 'different-id' };
      const nonAdminUser = {
        ...mockTestUser,
        id: 'current-user-id',
        roles: [{ id: 'client-role-id', name: ValidRoles.client, users: [] }], // Not an admin
        checkFieldsBeforeChanges: jest.fn(),
      } as User;

      userRepository.findOne.mockResolvedValue(userToUpdate);

      await expect(
        service.update('different-id', updateUserDto, nonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when email already exists', async () => {
      const updateUserDto = { email: 'existing@example.com' };
      const userToUpdate = { ...mockTestUser, email: 'old@example.com' };
      const authUser = {
        ...mockAdminUser,
        checkFieldsBeforeChanges: jest.fn(),
      } as User;
      const existingUser = { id: 'other-id', email: 'existing@example.com' };

      userRepository.findOne.mockResolvedValueOnce(userToUpdate);
      userRepository.findOneBy.mockResolvedValue(existingUser);

      await expect(
        service.update('123', updateUserDto, authUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user without password change', async () => {
      // Clear previous mock calls
      jest.clearAllMocks();

      const updateUserDto = { fullName: 'New Name' }; // No password field
      const userToUpdate = { ...mockTestUser };
      const authUser = {
        ...mockAdminUser,
        checkFieldsBeforeChanges: jest.fn(),
      } as User;
      const updatedUser = { ...userToUpdate, fullName: 'New Name' };

      userRepository.findOne.mockResolvedValueOnce(userToUpdate);
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValueOnce(updatedUser);

      const result = await service.update('123', updateUserDto, authUser);

      expect(result.fullName).toBe('New Name');
      // Check that bcrypt.hashSync was not called during this specific test
      expect(bcrypt.hashSync).not.toHaveBeenCalled();
    });

    it('should allow user to update their own profile', async () => {
      const updateUserDto = { fullName: 'My New Name' };
      const userToUpdate = { ...mockTestUser, id: 'user-123' };
      const authUser = {
        ...mockTestUser,
        id: 'user-123', // Same ID as user being updated
        roles: [{ id: 'client-role-id', name: ValidRoles.client, users: [] }], // Not admin but same user
        checkFieldsBeforeChanges: jest.fn(),
      } as User;
      const updatedUser = { ...userToUpdate, fullName: 'My New Name' };

      userRepository.findOne.mockResolvedValueOnce(userToUpdate);
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValueOnce(updatedUser);

      const result = await service.update('user-123', updateUserDto, authUser);

      expect(result.fullName).toBe('My New Name');
    });

    it('should allow email update when new email is not taken', async () => {
      const updateUserDto = { email: 'newemail@example.com' };
      const userToUpdate = { ...mockTestUser, email: 'old@example.com' };
      const authUser = {
        ...mockAdminUser,
        checkFieldsBeforeChanges: jest.fn(),
      } as User;
      const updatedUser = { ...userToUpdate, email: 'newemail@example.com' };

      userRepository.findOne.mockResolvedValueOnce(userToUpdate);
      userRepository.findOneBy.mockResolvedValue(null); // Email not taken
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValueOnce(updatedUser);

      const result = await service.update('123', updateUserDto, authUser);

      expect(result.email).toBe('newemail@example.com');
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockTestUser);
      userRepository.remove.mockResolvedValue(mockTestUser);

      const result = await service.remove('123');

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('encryptPassword', () => {
    it('should encrypt password correctly', () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedPassword';
      (bcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);

      const result = service.encryptPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hashSync).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('handleException', () => {
    it('should handle PostgreSQL duplicate key error (23505)', () => {
      const error = new Error('Duplicate key');
      (error as any).code = '23505';
      (error as any).detail = 'Key (email)=(test@example.com) already exists';

      const throwException = () => {
        // Using prototype to access private method for testing
        (service as any).handleException(error);
      };

      expect(throwException).toThrow(
        'Key (email)=(test@example.com) already exists',
      );
    });

    it('should handle other database errors with generic message', () => {
      const error = new Error('Some other database error');
      (error as any).code = 'OTHER_ERROR';

      const throwException = () => {
        // Using prototype to access private method for testing
        (service as any).handleException(error);
      };

      expect(throwException).toThrow('Unexpected error, check server logs');
    });

    it('should handle errors without code property', () => {
      const error = new Error('Random error');

      const throwException = () => {
        // Using prototype to access private method for testing
        (service as any).handleException(error);
      };

      expect(throwException).toThrow('Unexpected error, check server logs');
    });
  });

  describe('advanced edge cases', () => {
    it('should handle create user with malformed role data', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      const defaultRole = { ...mockRole, name: ValidRoles.client };
      const savedUser = {
        ...mockTestUser,
        roles: undefined, // Simulate malformed role data
      };

      roleRepository.findOneBy.mockResolvedValue(defaultRole);
      userRepository.create.mockReturnValue(createUserDto);
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should handle null password in user object during login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = { ...mockTestUser, password: null };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty password in update request', async () => {
      // Clear previous mocks to isolate this test
      jest.clearAllMocks();
      const updateUserDto = { password: '' };
      const userId = mockTestUser.id;
      const existingUser = { ...mockTestUser };
      const authUser = {
        ...mockAdminUser,
        checkFieldsBeforeChanges: jest.fn(),
      } as User;

      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValue({
        ...existingUser,
        password: '',
      });

      const result = await service.update(userId, updateUserDto, authUser);

      expect(result).toBeDefined();
      expect(bcrypt.hashSync).not.toHaveBeenCalled(); // Empty password is falsy, no encryption
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        password: '',
      });
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when trying to delete the last admin', async () => {
      const userId = 'admin-user-id';
      const adminUser = {
        ...mockAdminUser,
        id: userId,
        roles: [{ name: 'admin' }],
      };

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(adminUser);

      // Create a proper QueryBuilder mock
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Only 1 admin
      };
      userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(service.remove(userId)).rejects.toThrow(BadRequestException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['roles'],
      });
    });

    it('should allow deleting admin when there are multiple admins', async () => {
      const userId = 'admin-user-id';
      const adminUser = {
        ...mockAdminUser,
        id: userId,
        roles: [{ name: 'admin' }],
      };

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(adminUser);

      // Create a proper QueryBuilder mock with multiple admins
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2), // 2 admins
      };
      userRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(userId);

      expect(result).toEqual({
        message: `User with ID ${userId} deleted successfully`,
      });
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should handle database error when deleting user', async () => {
      const userId = 'admin-user-id';
      const adminUser = {
        ...mockAdminUser,
        id: userId,
        roles: [{ name: 'admin' }],
      };

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(adminUser);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      userRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should delete non-admin user without admin count check', async () => {
      const userId = 'regular-user-id';
      const regularUser = {
        ...mockTestUser,
        id: userId,
        roles: [{ name: 'client' }],
      };

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(regularUser);
      userRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(userId);

      expect(result).toEqual({
        message: `User with ID ${userId} deleted successfully`,
      });
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
      expect(userRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('additional edge cases', () => {
    it('should handle user not found after update scenario', async () => {
      const userId = 'user-123';
      const updateUserDto: UpdateUserDto = { email: 'newemail@example.com' };
      const authUser = {
        ...mockAdminUser,
        checkFieldsBeforeChanges: jest.fn(),
      } as User;

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValueOnce(mockTestUser); // For initial find
      userRepository.findOneBy.mockResolvedValue(null); // For email check
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValueOnce(null); // After update, user not found

      await expect(
        service.update(userId, updateUserDto, authUser),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle update with error throwing', async () => {
      const userId = 'user-123';
      const updateUserDto: UpdateUserDto = { email: 'test@example.com' };
      const authUser = {
        ...mockAdminUser,
        checkFieldsBeforeChanges: jest.fn(),
      } as User;

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(mockTestUser);
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(
        service.update(userId, updateUserDto, authUser),
      ).rejects.toThrow();
    });

    it('should handle bcrypt comparison errors in login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };

      userRepository.findOne.mockResolvedValue(mockTestUser);

      // Mock bcrypt.compareSync to throw an error
      (bcrypt.compareSync as jest.Mock).mockImplementation(() => {
        throw new Error('Bcrypt error');
      });

      await expect(service.login(loginDto)).rejects.toThrow(Error);

      // Reset mock to normal behavior
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
    });

    it('should handle role finding error during user creation', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        age: 25,
        roles: ['invalid-role'],
      };

      roleRepository.findOne.mockRejectedValue(new Error('Role not found'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('additional negative test cases', () => {
    it('should throw NotFoundException when trying to findOne with invalid user ID', async () => {
      const userId = 'invalid-user-id';

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException when findAll fails', async () => {
      jest.clearAllMocks();
      userRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException when save fails with constraint violation', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        age: 25,
        roles: ['client'],
      };

      jest.clearAllMocks();
      roleRepository.findOneBy.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue(mockTestUser);
      userRepository.save.mockRejectedValue({
        code: '23505', // Unique constraint violation (duplicate key)
        detail: 'Email already exists',
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle non-admin user trying to update other user profile', async () => {
      const userId = 'other-user-123';
      const updateUserDto = { email: 'updated@test.com' };
      const authUser = {
        ...mockTestUser,
        id: 'current-user-123',
        roles: [{ ...mockRole, name: 'client' }],
        checkFieldsBeforeChanges: jest.fn(),
      } as User;

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue({
        ...mockTestUser,
        id: userId,
      });

      await expect(
        service.update(userId, updateUserDto, authUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow user to update their own profile', async () => {
      const userId = 'user-123';
      const updateUserDto = { email: 'updated@test.com' };
      const authUser = {
        ...mockTestUser,
        id: userId,
        roles: [{ ...mockRole, name: 'client' }],
        checkFieldsBeforeChanges: jest.fn(),
      } as User;

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(authUser);
      userRepository.findOneBy.mockResolvedValue(null); // No email conflict
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne
        .mockResolvedValueOnce(authUser)
        .mockResolvedValueOnce({
          ...authUser,
          email: 'updated@test.com',
        });

      const result = await service.update(userId, updateUserDto, authUser);

      expect(result).toBeDefined();
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should handle login with user that has no password set', async () => {
      const loginDto = { email: 'test@test.com', password: 'password123' };
      const userWithoutPassword = { ...mockTestUser, password: undefined };

      jest.clearAllMocks();
      userRepository.findOne.mockResolvedValue(userWithoutPassword);

      // Mock bcrypt.compareSync to return false when password is undefined
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle createSubscriptionForUser failure during user creation', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        age: 25,
        roles: ['client'],
      };

      jest.clearAllMocks();
      roleRepository.findOneBy.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue(mockTestUser);
      userRepository.save.mockResolvedValue(mockTestUser);
      const mockSubscriptionsService = subscriptionsService as any;
      mockSubscriptionsService.createSubscriptionForUser.mockRejectedValue(
        new Error('Subscription service unavailable'),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
