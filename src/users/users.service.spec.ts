import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return create message', () => {
      const createUserDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        age: 25,
        password: 'password123',
      };

      const result = service.create(createUserDto);
      expect(result).toBe('This action adds a new user');
    });
  });

  describe('findAll', () => {
    it('should return findAll message', () => {
      const result = service.findAll();
      expect(result).toBe('This action returns all users');
    });
  });

  describe('findOne', () => {
    it('should return findOne message', () => {
      const id = 1;
      const result = service.findOne(id);
      expect(result).toBe(`This action returns a #${id} user`);
    });
  });

  describe('update', () => {
    it('should return update message', () => {
      const id = 1;
      const updateUserDto = { fullName: 'Updated User' };
      const result = service.update(id, updateUserDto);
      expect(result).toBe(`This action updates a #${id} user`);
    });
  });

  describe('remove', () => {
    it('should return remove message', () => {
      const id = 1;
      const result = service.remove(id);
      expect(result).toBe(`This action removes a #${id} user`);
    });
  });
});
