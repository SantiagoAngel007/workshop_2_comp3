import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './entities/users.entity';
import { Role } from './entities/roles.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'uuid1',
    email: 'test@example.com',
    fullName: 'Test User',
    age: 25,
    password: 'hashedPassword',
    isActive: true,
    roles: [],
  };

  const mockRole = {
    id: 'roleUuid',
    name: 'client',
    users: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwtToken'),
          },
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('create', () => {
    it('should create a new user with default role "client"', async () => {
      const dto = {
        email: 'new@example.com',
        fullName: 'New User',
        age: 30,
        password: 'password123',
      };

      jest.spyOn(roleRepository, 'findOneBy').mockResolvedValue(mockRole);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
      expect(result.token).toBe('jwtToken');
      expect(result.password).toBeUndefined();
      expect(userRepository.create).toHaveBeenCalledWith({
        ...dto,
        password: expect.any(String),
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw an error if default role "client" is not found', async () => {
      jest.spyOn(roleRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.create({} as any)).rejects.toThrow(
        'Rol por defecto "client" no encontrado',
      );
    });
  });

  describe('login', () => {
    it('should return user and token if credentials are correct', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = bcrypt.hashSync(dto.password, 10);
      const userWithPassword = { ...mockUser, password: hashedPassword };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithPassword as any);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      const result = await service.login(dto as any);

      expect(result).toBeDefined();
      expect(result.token).toBe('jwtToken');
      expect(result.password).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login({} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const userWithPassword = { ...mockUser, password: 'wrongHash' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithPassword as any);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      await expect(service.login({} as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const dto = { fullName: 'Updated Name' };
      const userBeforeUpdate = { ...mockUser, roles: [] };
      const userAfterUpdate = { ...mockUser, fullName: 'Updated Name', roles: [] };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userBeforeUpdate as any);
      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(userBeforeUpdate as any).mockResolvedValueOnce(userAfterUpdate as any);

      const result = await service.update('uuid1', dto as any);

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Updated Name');
      expect(userRepository.update).toHaveBeenCalledWith('uuid1', dto);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update('uuid1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const user = { ...mockUser, roles: [{ name: 'client' }] };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(userRepository, 'delete').mockResolvedValue(undefined);

      const result = await service.remove('uuid1');

      expect(result).toEqual({ message: 'User with ID uuid1 deleted successfully' });
    });

    it('should throw BadRequestException if trying to delete the last admin', async () => {
      const adminUser = { ...mockUser, roles: [{ name: 'admin' }] };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(adminUser as any);
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      } as any);

      await expect(service.remove('uuid1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove('uuid1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('encryptPassword', () => {
    it('should hash password with bcrypt', () => {
      const password = 'plainPassword';
      const hashed = service.encryptPassword(password);
      expect(hashed).not.toBe(password);
      expect(bcrypt.compareSync(password, hashed)).toBe(true);
    });
  });
});