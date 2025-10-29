import { User } from './users.entity';
import { Role } from './roles.entity';
import { ValidRoles } from '../enums/roles.enum';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.id = 'test-user-id';
    user.email = 'Test@Example.com';
    user.fullName = 'Test User';
    user.age = 25;
    user.password = 'hashedPassword123';
    user.isActive = true;
    user.roles = [];
    user.subscriptions = [];
    user.attendances = [];
  });

  describe('checkFieldsBeforeChanges', () => {
    it('should convert email to lowercase and trim spaces', () => {
      user.email = '  Test@Example.com  ';
      user.checkFieldsBeforeChanges();
      expect(user.email).toBe('test@example.com');
    });

    it('should handle email with mixed case', () => {
      user.email = 'TeSt@ExAmPlE.cOm';
      user.checkFieldsBeforeChanges();
      expect(user.email).toBe('test@example.com');
    });

    it('should handle email with surrounding whitespace', () => {
      user.email = '   test@example.com   ';
      user.checkFieldsBeforeChanges();
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('relationships', () => {
    it('should handle roles assignment', () => {
      const adminRole = new Role();
      adminRole.id = 'admin-role-id';
      adminRole.name = ValidRoles.admin;

      const clientRole = new Role();
      clientRole.id = 'client-role-id';
      clientRole.name = ValidRoles.client;

      user.roles = [adminRole, clientRole];

      expect(user.roles).toHaveLength(2);
      expect(user.roles.map(r => r.name)).toContain(ValidRoles.admin);
      expect(user.roles.map(r => r.name)).toContain(ValidRoles.client);
    });

    it('should handle empty roles array', () => {
      user.roles = [];
      expect(user.roles).toHaveLength(0);
    });

    it('should handle subscriptions assignment', () => {
      const mockSubscription = { id: 'sub-1', isActive: true };
      user.subscriptions = [mockSubscription];
      expect(user.subscriptions).toHaveLength(1);
      expect(user.subscriptions[0].id).toBe('sub-1');
    });

    it('should handle attendances assignment', () => {
      const mockAttendance = { id: 'att-1', checkInTime: new Date() };
      user.attendances = [mockAttendance];
      expect(user.attendances).toHaveLength(1);
      expect(user.attendances[0].id).toBe('att-1');
    });
  });

  describe('properties', () => {
    it('should handle all properties correctly', () => {
      expect(user.id).toBe('test-user-id');
      expect(user.email).toBe('Test@Example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.age).toBe(25);
      expect(user.password).toBe('hashedPassword123');
      expect(user.isActive).toBe(true);
    });

    it('should handle optional password', () => {
      const newUser = new User();
      newUser.email = 'test@example.com';
      newUser.fullName = 'Test User';
      newUser.age = 25;
      // Not setting password
      expect(newUser.password).toBeUndefined();
    });
  });
});