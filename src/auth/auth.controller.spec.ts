import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { mockUser } from '../../test/utils/test-utils';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    create: jest.fn(),
    login: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };
      const expectedResult = { ...mockUser, token: 'jwt-token' };

      mockAuthService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(authService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { ...mockUser, token: 'jwt-token' };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedResult = [mockUser];

      mockAuthService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(authService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const userId = '123';
      const expectedResult = mockUser;

      mockAuthService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(userId);

      expect(result).toEqual(expectedResult);
      expect(authService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const userId = '123';
      const updateUserDto = { fullName: 'Updated Name' };
      const authUser = mockUser;
      const expectedResult = { ...mockUser, fullName: 'Updated Name' };

      mockAuthService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(userId, updateUserDto, authUser);

      expect(result).toEqual(expectedResult);
      expect(authService.update).toHaveBeenCalledWith(userId, updateUserDto, authUser);
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      const userId = '123';
      const expectedResult = { message: 'User deleted successfully' };

      mockAuthService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(userId);

      expect(result).toEqual(expectedResult);
      expect(authService.remove).toHaveBeenCalledWith(userId);
    });
  });
});
