import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };
      const expectedResult = 'This action adds a new user';

      mockUsersService.create.mockReturnValue(expectedResult);

      const result = controller.create(createUserDto);

      expect(result).toBe(expectedResult);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', () => {
      const expectedResult = 'This action returns all users';

      mockUsersService.findAll.mockReturnValue(expectedResult);

      const result = controller.findAll();

      expect(result).toBe(expectedResult);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user by id', () => {
      const id = '1';
      const expectedResult = 'This action returns a #1 user';

      mockUsersService.findOne.mockReturnValue(expectedResult);

      const result = controller.findOne(id);

      expect(result).toBe(expectedResult);
      expect(usersService.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should update user', () => {
      const id = '1';
      const updateUserDto = { fullName: 'Updated User' };
      const expectedResult = 'This action updates a #1 user';

      mockUsersService.update.mockReturnValue(expectedResult);

      const result = controller.update(id, updateUserDto);

      expect(result).toBe(expectedResult);
      expect(usersService.update).toHaveBeenCalledWith(+id, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove user', () => {
      const id = '1';
      const expectedResult = 'This action removes a #1 user';

      mockUsersService.remove.mockReturnValue(expectedResult);

      const result = controller.remove(id);

      expect(result).toBe(expectedResult);
      expect(usersService.remove).toHaveBeenCalledWith(+id);
    });
  });
});
