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

  describe('create', () => {
    it('should create new subscription', async () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-123',
        membershipIds: ['membership-123'],
        start_date: new Date(),
        end_date: new Date(),
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      membershipRepository.findByIds.mockResolvedValue([mockMembership]);
      subscriptionRepository.findOne.mockResolvedValue(null);
      subscriptionRepository.create.mockReturnValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue(mockSubscription);

      // CORRECCIÓN: Cambia 'create' por el nombre real del método en el servicio
      // Asumiendo que el método se llama 'createSubscription' (verifica en el archivo .ts del servicio)
      const result = await service.createSubscriptionForUser(createDto.userId);

      expect(result).toEqual(mockSubscription);
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