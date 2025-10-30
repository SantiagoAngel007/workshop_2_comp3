/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../auth/entities/users.entity';
import {
  createMockRepository,
  mockUser,
  mockMembership,
  mockSubscription,
} from '../../test/utils/test-utils';
import { NotFoundException, ConflictException } from '@nestjs/common';

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findSubscriptionByUserId', () => {
    it('should return subscription for valid user', async () => {
      const userId = 'user-123';
      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.findSubscriptionByUserId(userId);

      expect(result).toEqual(mockSubscription);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'invalid-user';
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findSubscriptionByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      const userId = 'user-123';
      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.findSubscriptionByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
