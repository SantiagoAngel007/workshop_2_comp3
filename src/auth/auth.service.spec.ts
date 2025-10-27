import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/users.entity';
import { Role } from './entities/roles.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { createMockRepository, mockUser, mockRole } from '../../test/utils/test-utils';
import { UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ValidRoles } from './enums/roles.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let roleRepository: any;
  let jwtService: JwtService;
  let subscriptionsService: SubscriptionsService;

  beforeEach(async () => {
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
            sign: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            createSubscriptionForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    jwtService = module.get<JwtService>(JwtService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
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
      const savedUser = { ...mockUser, roles: [defaultRole] };

      (bcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      roleRepository.findOneBy.mockResolvedValue(defaultRole);
      userRepository.create.mockReturnValue({ ...createUserDto, password: hashedPassword });
      userRepository.save.mockResolvedValue(savedUser);
      subscriptionsService.createSubscriptionForUser.mockResolvedValue({});
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        age: createUserDto.age,
        password: hashedPassword,
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
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

      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle database errors during user creation', async () => {
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

      await expect(service.create(createUserDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = { ...mockUser, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('jwt-token');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = { ...mockUser, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = { ...mockUser, isActive: false, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith({ relations: ['roles'] });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('123');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['roles'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto = { fullName: 'Updated Name' };
      const existingUser = { ...mockUser };
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };

      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('123', updateUserDto);

      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserDto = { fullName: 'Updated Name' };
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('123', updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should hash password if provided in update', async () => {
      const updateUserDto = { password: 'newpassword' };
      const existingUser = { ...mockUser };
      const hashedPassword = 'newHashedPassword';

      userRepository.findOne.mockResolvedValue(existingUser);
      (bcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      userRepository.save.mockResolvedValue({ ...existingUser, password: hashedPassword });

      await service.update('123', updateUserDto);

      expect(bcrypt.hashSync).toHaveBeenCalledWith('newpassword', 10);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      const result = await service.remove('123');

      expect(result).toEqual(mockUser);
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

  describe('getJwtToken', () => {
    it('should generate JWT token', () => {
      const payload = { id: '123' };
      const token = 'jwt-token';
      jwtService.sign.mockReturnValue(token);

      const result = service.getJwtToken(payload);

      expect(result).toBe(token);
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });
  });
});
