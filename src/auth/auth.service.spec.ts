import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/users.entity';
import { Role } from './entities/roles.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { createMockRepository, mockUser, mockRole } from '../../test/utils/test-utils';
import { UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
          useValue: createMockRepository(), // Asegúrate de que este mock incluya 'save' y 'findOne'
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

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('jwt-token');
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

      const user = { ...mockUser, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should login inactive user (no validation in current implementation)', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = { ...mockUser, isActive: false, password: 'hashedPassword' };
      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('token');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ ...mockUser }];
      // No se debe incluir la contraseña en la respuesta
      const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      userRepository.find.mockResolvedValue(usersWithoutPassword);

      const result = await service.findAll();

      expect(result).toEqual(usersWithoutPassword);
      expect(userRepository.find).toHaveBeenCalledWith({ relations: ['roles'] });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('123');

      expect(result).toEqual(mockUser);
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
      const authUser = { ...mockUser, roles: [{ name: ValidRoles.admin }] }; // Definimos authUser

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
      const authUser = { ...mockUser, roles: [{ name: ValidRoles.admin }] };
      const userId = '123';

      // Mock para findOne: simula que no encuentra el usuario
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto, authUser)).rejects.toThrow(NotFoundException);
    });

    it('should hash password if provided in update', async () => {
      const updateUserDto = { password: 'newpassword' };
      const userId = mockUser.id;
      const existingUser = { ...mockUser, password: 'oldHashedPassword' };
      const authUser = { ...mockUser, roles: [{ name: ValidRoles.admin }] };
      const newHashedPassword = 'newHashedPassword';

      userRepository.findOne.mockResolvedValue(existingUser);
      // Mock para bcrypt.hashSync
      (bcrypt.hashSync as jest.Mock).mockReturnValue(newHashedPassword);
      // Mock para save: simula el guardado con la nueva contraseña hasheada
      userRepository.save.mockResolvedValue({ ...existingUser, password: newHashedPassword });

      await service.update(userId, updateUserDto, authUser);

      // Verifica que bcrypt.hashSync se haya llamado con la nueva contraseña
      expect(bcrypt.hashSync).toHaveBeenCalledWith('newpassword', 10);

      // Verifica que save se haya llamado con el usuario actualizado
      expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, { password: newHashedPassword });
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

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