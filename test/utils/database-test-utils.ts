import { Repository } from 'typeorm';
import { User } from '../../src/auth/entities/users.entity';
import { Role } from '../../src/auth/entities/roles.entity';
import { Subscription } from '../../src/subscriptions/entities/subscription.entity';
import { Membership } from '../../src/memberships/entities/membership.entity';
import { ValidRoles } from '../../src/auth/enums/roles.enum';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

export class DatabaseTestUtils {
  static async cleanDatabase(
    userRepository: Repository<User>,
    roleRepository: Repository<Role>,
    subscriptionRepository: Repository<Subscription>,
    membershipRepository: Repository<Membership>,
  ) {
    await subscriptionRepository.clear();
    await membershipRepository.clear();
    await userRepository.clear();
    await roleRepository.clear();
  }

  static async seedRoles(roleRepository: Repository<Role>) {
    const roles = [
      { name: ValidRoles.client },
      { name: ValidRoles.admin },
      { name: ValidRoles.receptionist },
    ];

    const roleEntities = roles.map((role) => roleRepository.create(role));
    return await roleRepository.save(roleEntities);
  }

  static async createTestUser(
    userRepository: Repository<User>,
    roleRepository: Repository<Role>,
    userData: Partial<User> = {},
    roleName: ValidRoles = ValidRoles.client,
  ): Promise<User> {
    const role = await roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const defaultUserData = {
      email: 'test@example.com',
      fullName: 'Test User',
      age: 25,

      password: bcrypt.hashSync('password123', 10),
      isActive: true,
      roles: [role],
    };

    const user = userRepository.create({ ...defaultUserData, ...userData });
    return await userRepository.save(user);
  }

  static async createTestMembership(
    membershipRepository: Repository<Membership>,
    membershipData: Partial<Membership> = {},
  ): Promise<Membership> {
    const defaultMembershipData = {
      name: 'Test Membership',
      cost: 50,
      status: true,
      max_classes_assistance: 10,
      max_gym_assistance: 30,
      duration_months: 1,
    };

    const membership = membershipRepository.create({
      ...defaultMembershipData,
      ...membershipData,
    });
    return await membershipRepository.save(membership);
  }

  static async createTestSubscription(
    subscriptionRepository: Repository<Subscription>,
    user: User,
    subscriptionData: Partial<Subscription> = {},
  ): Promise<Subscription> {
    const defaultSubscriptionData = {
      name: `Subscription for ${user.fullName}`,
      cost: 50,
      max_classes_assistance: 10,
      max_gym_assistance: 30,
      duration_months: 1,
      purchase_date: new Date(),
      user,
    };

    const subscription = subscriptionRepository.create({
      ...defaultSubscriptionData,
      ...subscriptionData,
    });
    return await subscriptionRepository.save(subscription);
  }
}

export const testConstants = {
  validEmail: 'test@example.com',
  validPassword: 'password123',
  validFullName: 'Test User',
  validAge: 25,
  invalidEmail: 'invalid-email',
  nonExistentId: '123e4567-e89b-12d3-a456-426614174000',
};
