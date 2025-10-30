import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { mockSubscription } from '../../test/utils/test-utils';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let subscriptionsService: SubscriptionsService;

  const mockSubscriptionsService = {
    findSubscriptionByUserId: jest.fn(),
    createSubscriptionForUser: jest.fn(),
    addMembershipToSubscription: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    deactivateSubscription: jest.fn(),
    activateSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubscriptionByUserId', () => {
    it('should return subscription for user', async () => {
      const userId = 'user-123';
      const expectedResult = mockSubscription;

      mockSubscriptionsService.findSubscriptionByUserId.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getSubscriptionByUserId(userId);

      expect(result).toEqual(expectedResult);
      expect(
        subscriptionsService.findSubscriptionByUserId,
      ).toHaveBeenCalledWith(userId);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription for user', async () => {
      const userId = 'user-123';
      const expectedResult = mockSubscription;

      mockSubscriptionsService.createSubscriptionForUser.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.createSubscription(userId);

      expect(result).toEqual(expectedResult);
      expect(
        subscriptionsService.createSubscriptionForUser,
      ).toHaveBeenCalledWith(userId);
    });
  });

  describe('addMembership', () => {
    it('should add membership to subscription', async () => {
      const subscriptionId = 'sub-123';
      const addMembershipDto = { membershipId: 'mem-123' };
      const expectedResult = mockSubscription;

      mockSubscriptionsService.addMembershipToSubscription.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.addMembership(
        subscriptionId,
        addMembershipDto,
      );

      expect(result).toEqual(expectedResult);
      expect(
        subscriptionsService.addMembershipToSubscription,
      ).toHaveBeenCalledWith(subscriptionId, addMembershipDto);
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions', async () => {
      const expectedResult = [mockSubscription];

      mockSubscriptionsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(subscriptionsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return subscription by id', async () => {
      const subscriptionId = 'sub-123';
      const expectedResult = mockSubscription;

      mockSubscriptionsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(subscriptionId);

      expect(result).toEqual(expectedResult);
      expect(subscriptionsService.findOne).toHaveBeenCalledWith(subscriptionId);
    });
  });

  describe('update', () => {
    it('should update subscription', async () => {
      const subscriptionId = 'sub-123';
      const updateSubscriptionDto = { name: 'Updated Subscription' };
      const expectedResult = {
        ...mockSubscription,
        name: 'Updated Subscription',
      };

      mockSubscriptionsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(
        subscriptionId,
        updateSubscriptionDto,
      );

      expect(result).toEqual(expectedResult);
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        subscriptionId,
        updateSubscriptionDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove subscription', async () => {
      const subscriptionId = 'sub-123';
      const expectedResult = mockSubscription;

      mockSubscriptionsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(subscriptionId);

      expect(result).toEqual(expectedResult);
      expect(subscriptionsService.remove).toHaveBeenCalledWith(subscriptionId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate subscription', async () => {
      const id = 'sub-123';
      const expectedResult = {
        message: 'Subscription deactivated successfully',
      };

      mockSubscriptionsService.deactivateSubscription.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deactivate(id);

      expect(result).toEqual(expectedResult);
      expect(subscriptionsService.deactivateSubscription).toHaveBeenCalledWith(
        id,
      );
    });
  });

  describe('activate', () => {
    it('should activate subscription', async () => {
      const id = 'sub-123';
      const expectedResult = { message: 'Subscription activated successfully' };

      mockSubscriptionsService.activateSubscription.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.activate(id);

      expect(result).toEqual(expectedResult);
      expect(subscriptionsService.activateSubscription).toHaveBeenCalledWith(
        id,
      );
    });

    it('should handle activation errors', async () => {
      const id = 'sub-123';
      const error = new Error('Activation failed');

      mockSubscriptionsService.activateSubscription.mockRejectedValue(error);

      await expect(controller.activate(id)).rejects.toThrow(
        'Activation failed',
      );
    });
  });

  describe('additional edge cases', () => {
    it('should handle service errors in findAll', async () => {
      mockSubscriptionsService.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });

    it('should handle service errors in update', async () => {
      const subscriptionId = 'sub-123';
      const updateDto = { name: 'Updated' };

      mockSubscriptionsService.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.update(subscriptionId, updateDto),
      ).rejects.toThrow('Update failed');
    });

    it('should handle service errors in remove', async () => {
      const subscriptionId = 'sub-123';

      mockSubscriptionsService.remove.mockRejectedValue(
        new Error('Remove failed'),
      );

      await expect(controller.remove(subscriptionId)).rejects.toThrow(
        'Remove failed',
      );
    });
  });
});
