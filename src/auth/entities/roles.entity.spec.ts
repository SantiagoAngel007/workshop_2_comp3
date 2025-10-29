import { Role } from './roles.entity';
import { ValidRoles } from '../enums/roles.enum';
import { User } from './users.entity';

describe('Role Entity', () => {
  describe('instantiation', () => {
    it('should create a new role instance', () => {
      const role = new Role();
      role.id = 'test-id';
      role.name = ValidRoles.admin;
      role.users = [];

      expect(role).toBeDefined();
      expect(role.id).toBe('test-id');
      expect(role.name).toBe(ValidRoles.admin);
      expect(role.users).toEqual([]);
    });

    it('should create a role with users', () => {
      const mockUser = new User();
      mockUser.id = 'user-1';
      mockUser.email = 'test@example.com';

      const role = new Role();
      role.id = 'test-id';
      role.name = ValidRoles.client;
      role.users = [mockUser];

      expect(role.users).toHaveLength(1);
      expect(role.users[0].id).toBe('user-1');
    });

    it('should handle multiple users in a role', () => {
      const mockUser1 = new User();
      mockUser1.id = 'user-1';
      mockUser1.email = 'test1@example.com';

      const mockUser2 = new User();
      mockUser2.id = 'user-2';
      mockUser2.email = 'test2@example.com';

      const role = new Role();
      role.id = 'test-id';
      role.name = ValidRoles.client;
      role.users = [mockUser1, mockUser2];

      expect(role.users).toHaveLength(2);
      expect(role.users.map(u => u.id)).toEqual(['user-1', 'user-2']);
    });
  });
});