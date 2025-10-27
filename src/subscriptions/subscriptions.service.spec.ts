import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../auth/entities/users.entity';
import { createMockRepository, mockUser, mockMembership, mockSubscription } from '../../test/utils/test-utils';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AddMembershipDto } from './dto/add-membership.dto';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: any;
  let membershipRepository: any;
  let userRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
    membershipRepository = module.get(getRepositoryToken(Membership));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all subscriptions', async () => {
      subscriptionRepository.find.mockResolvedValue([mockSubscription]);

      const result = await service.findAll();

      expect(result).toEqual([mockSubscription]);
    });
  });

  describe('findOne', () => {
    it('should return subscription by id', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.findOne('subscription-123');

      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSubscriptionForUser', () => {
    it('should create new subscription for a user', async () => {
      const userId = 'user-123';
      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(null); // No active subscription
      subscriptionRepository.create.mockImplementation(dto => dto);
      subscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.createSubscriptionForUser(userId);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'invalid-user';
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createSubscriptionForUser(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already has an active subscription', async () => {
      const userId = 'user-123';
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(service, 'hasActiveSubscription').mockResolvedValue(true);

      await expect(service.createSubscriptionForUser(userId)).rejects.toThrow(ConflictException);
    });
  });

  describe('addMembershipToSubscription', () => {
    it('should add membership to subscription', async () => {
      const subscriptionId = 'subscription-123';
      const addMembershipDto: AddMembershipDto = { membershipId: 'membership-123' };
      
      membershipRepository.findOne.mockResolvedValue(mockMembership);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.addMembershipToSubscription(subscriptionId, addMembershipDto);

      expect(result).toEqual(mockSubscription);
      expect(membershipRepository.findOne).toHaveBeenCalledWith({ where: { id: addMembershipDto.membershipId } });
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({ where: { id: subscriptionId }, relations: ['memberships'] });
      expect(subscriptionRepository.save).toHaveBeenCalledWith(mockSubscription);
    });

    it('should throw NotFoundException if membership not found', async () => {
      const subscriptionId = 'subscription-123';
      const addMembershipDto: AddMembershipDto = { membershipId: 'invalid-membership' };

      membershipRepository.findOne.mockResolvedValue(null);

      await expect(service.addMembershipToSubscription(subscriptionId, addMembershipDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      const subscriptionId = 'invalid-subscription';
      const addMembershipDto: AddMembershipDto = { membershipId: 'membership-123' };

      membershipRepository.findOne.mockResolvedValue(mockMembership);
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.addMembershipToSubscription(subscriptionId, addMembershipDto)).rejects.toThrow(NotFoundException);
    });
  });
  describe('update', () => {
    it('should update subscription', async () => {
      const updateDto: UpdateSubscriptionDto = {
        membershipIds: ['membership-123'],
      };

      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      membershipRepository.findByIds.mockResolvedValue([mockMembership]);
      subscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.update('subscription-123', updateDto);

      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException if one or more memberships not found', async () => {
      const updateDto: UpdateSubscriptionDto = {
        membershipIds: ['membership-123', 'invalid-membership'],
      };

      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      membershipRepository.findByIds.mockResolvedValue([mockMembership]);

      await expect(service.update('subscription-123', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateSubscription', () => {
    it('should deactivate a subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue({ ...mockSubscription, isActive: false });

      const result = await service.deactivateSubscription('subscription-123');

      expect(result.isActive).toBe(false);
    });
  });

  describe('activateSubscription', () => {
    it('should activate a subscription', async () => {
      const inactiveSubscription = { ...mockSubscription, isActive: false, user: mockUser };
      subscriptionRepository.findOne.mockResolvedValue(inactiveSubscription);
      subscriptionRepository.save.mockResolvedValue({ ...inactiveSubscription, isActive: true });
      jest.spyOn(service, 'hasActiveSubscription').mockResolvedValue(false);

      const result = await service.activateSubscription('subscription-123');

      expect(result.isActive).toBe(true);
    });

    it('should throw ConflictException if user already has an active subscription', async () => {
      const inactiveSubscription = { ...mockSubscription, isActive: false, user: mockUser };
      subscriptionRepository.findOne.mockResolvedValue(inactiveSubscription);
      jest.spyOn(service, 'hasActiveSubscription').mockResolvedValue(true);

      await expect(service.activateSubscription('subscription-123')).rejects.toThrow(ConflictException);
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true if user has active subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      const result = await service.hasActiveSubscription('user-123');
      expect(result).toBe(true);
    });

    it('should return false if user has no active subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);
      const result = await service.hasActiveSubscription('user-123');
      expect(result).toBe(false);
    });
  });
  describe('remove', () => {
    it('should remove subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepository.softRemove.mockResolvedValue(mockSubscription);

      await service.remove('subscription-123');

      expect(subscriptionRepository.softRemove).toHaveBeenCalledWith(mockSubscription);
    });
  });

  describe('findSubscriptionByUserId', () => {
    it('should return subscription for valid user', async () => {
      const userId = 'user-123';
      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.findSubscriptionByUserId(userId);

      expect(result).toEqual(mockSubscription);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'invalid-user';
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findSubscriptionByUserId(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      const userId = 'user-123';
      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.findSubscriptionByUserId(userId)).rejects.toThrow(NotFoundException);
    });
  });
});