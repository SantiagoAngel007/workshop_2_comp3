/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesService } from './attendances.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { User } from '../auth/entities/users.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { createMockRepository, mockUser, mockSubscription, mockMembership } from '../../test/utils/test-utils';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Between, MoreThanOrEqual } from 'typeorm';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let attendanceRepository: any;
  let userRepository: any;
  let subscriptionRepository: any;

      const mockAttendance = {
    id: 'attendance-123',
    user: mockUser,
    type: AttendanceType.GYM,
    entranceDatetime: new Date('2025-10-27T10:00:00.000Z'),
    exitDatetime: null,
    isActive: true,
    dateKey: '2025-10-27',
    created_at: new Date('2025-10-27T10:00:00.000Z'),
    updated_at: new Date('2025-10-27T10:00:00.000Z'),
  };  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-27T10:00:00.000Z'));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
    // Mock the methods that are called directly on the service in the tests
    attendanceRepository = module.get(getRepositoryToken(Attendance));
    userRepository = module.get(getRepositoryToken(User));
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAvailableAttendances', () => {
    it('should return zero attendances when user has no active subscription', async () => {
      const userId = 'user-123';
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.availableAttendances.gym).toBe(0);
      expect(result.availableAttendances.classes).toBe(0);
    });

    it('should handle errors in calculateAvailableAttendances', async () => {
      const userId = 'user-123';
      const baseDate = new Date('2025-10-27T10:00:00.000Z');
      const error = new Error('Database error');
      
      // Make the subscription query fail
      subscriptionRepository.findOne.mockRejectedValue(error);
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(0); // Not currently inside

      // Try to check in, which will trigger hasAvailableAttendances
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: '2025-10-27',
      };

      // The check-in should fail since there are no available passes due to the error
      await expect(service.checkIn(createAttendanceDto))
        .rejects.toThrow(ForbiddenException);

      // Verify that the subscription repository was queried
      expect(subscriptionRepository.findOne).toHaveBeenCalled();
    });

    it('should sum up passes from multiple memberships', async () => {
      const userId = 'user-123';
      const multiMembershipSubscription = {
        ...mockSubscription,
        memberships: [
          { max_gym_assistance: 10, max_classes_assistance: 5 },
          { max_gym_assistance: 5, max_classes_assistance: 3 },
        ],
      };

      subscriptionRepository.findOne.mockResolvedValue(multiMembershipSubscription);
      attendanceRepository.count.mockResolvedValueOnce(0) // gym attendances
        .mockResolvedValueOnce(0); // class attendances

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.availableAttendances.gym).toBe(15); // 10 + 5
      expect(result.availableAttendances.classes).toBe(8); // 5 + 3
    });

    it('should calculate remaining passes correctly after some usage', async () => {
      const userId = 'user-123';
      const subscription = {
        ...mockSubscription,
        memberships: [{ max_gym_assistance: 10, max_classes_assistance: 5 }],
      };

      subscriptionRepository.findOne.mockResolvedValue(subscription);
      attendanceRepository.count.mockResolvedValueOnce(3) // 3 gym attendances used
        .mockResolvedValueOnce(2); // 2 class attendances used

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.availableAttendances.gym).toBe(7); // 10 - 3
      expect(result.availableAttendances.classes).toBe(3); // 5 - 2
    });
  });

  describe('checkIn', () => {
    const baseDate = new Date('2025-10-27T10:00:00.000Z');
    const baseDateKey = '2025-10-27';

    it('should create attendance check-in successfully for gym', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValueOnce(0) // Not currently inside
        .mockResolvedValueOnce(0); // No gym attendances this month
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription); // Has a valid subscription
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      const result = await service.checkIn(createAttendanceDto);

      expect(result).toEqual(mockAttendance);
    });

    it('should create attendance check-in successfully for class', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.CLASS,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };
      const classAttendance = { ...mockAttendance, type: AttendanceType.CLASS };

      // Create subscription with available class passes
      const subscriptionWithClassPasses = {
        ...mockSubscription,
        memberships: [{
          ...mockMembership,
          max_classes_assistance: 10,  // Ensure enough class passes
          max_gym_assistance: 30
        }]
      };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count
        .mockResolvedValueOnce(0) // Not currently inside
        .mockResolvedValueOnce(0) // No class attendances this month (for validateUserCanEnter)
        .mockResolvedValueOnce(0); // No class attendances this month (for calculateAvailableAttendances)
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithClassPasses);
      attendanceRepository.create.mockReturnValue(classAttendance);
      attendanceRepository.save.mockResolvedValue(classAttendance);

      const result = await service.checkIn(createAttendanceDto);

      expect(result).toEqual(classAttendance);
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-123' }, isActive: true },
        relations: ['memberships']
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const createAttendanceDto = {
        userId: 'invalid-user',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };

      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user is already inside', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(1); // Already inside

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ForbiddenException if user has no available gym passes', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };
      const subscriptionWithNoPasses = { ...mockSubscription, memberships: [{ ...mockMembership, max_gym_assistance: 0 }] };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(0); // Not currently inside
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithNoPasses);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no available class passes', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.CLASS,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };
      const subscriptionWithNoPasses = { ...mockSubscription, memberships: [{ ...mockMembership, max_classes_assistance: 0 }] };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(0); // Not currently inside
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithNoPasses);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no active subscription', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(0); // Not currently inside
      subscriptionRepository.findOne.mockResolvedValue(null); // No active subscription

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has active subscription but no memberships', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };
      const subscriptionWithoutMemberships = { ...mockSubscription, memberships: [] };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(0); // Not currently inside
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithoutMemberships);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ForbiddenException);
    });

    it('should allow check-in when user has exactly enough passes left', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };
      const subscriptionWithExactPasses = {
        ...mockSubscription,
        memberships: [{ ...mockMembership, max_gym_assistance: 1 }]
      };
      const gymAttendance = { ...mockAttendance, type: AttendanceType.GYM };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValueOnce(0) // Not currently inside
        .mockResolvedValueOnce(0); // No gym attendances used
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithExactPasses);
      attendanceRepository.create.mockReturnValue(gymAttendance);
      attendanceRepository.save.mockResolvedValue(gymAttendance);

      const result = await service.checkIn(createAttendanceDto);

      expect(result).toEqual(gymAttendance);
    });

    it('should handle multiple active memberships with zero passes', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: baseDate.toISOString(),
        dateKey: baseDateKey,
      };
      const subscriptionWithMultipleZeroPasses = {
        ...mockSubscription,
        memberships: [
          { ...mockMembership, max_gym_assistance: 0 },
          { ...mockMembership, max_gym_assistance: 0 }
        ]
      };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(0); // Not currently inside
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithMultipleZeroPasses);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ForbiddenException);
    });
  });




  describe('checkOut', () => {
    it('should check out user successfully', async () => {
      const userId = 'user-123';
      const checkedOutAttendance = { ...mockAttendance, checkOut: new Date('2025-10-27T10:00:00.000Z'), isActive: false };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(checkedOutAttendance);

      const result = await service.checkOut(userId);

      expect(result).toEqual(checkedOutAttendance);
    });

    it('should throw NotFoundException if user has no active check-in', async () => {
      const userId = 'user-123';

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.checkOut(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('user validation', () => {
    it('should throw NotFoundException if user not found during check-in', async () => {
      const createAttendanceDto = {
        userId: 'invalid-user',
        type: AttendanceType.GYM,
        entranceDatetime: new Date().toISOString(),
        dateKey: '2025-10-27',
      };
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found during check-out', async () => {
      const userId = 'invalid-user';
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.checkOut(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserAttendanceStatus', () => {
    it('should return isInside: true and currentAttendance when user is inside', async () => {
      const userId = 'user-123';
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      attendanceRepository.count.mockResolvedValue(0);

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.isInside).toBe(true);
      expect(result.currentAttendance).toBeDefined();
      expect(result.availableAttendances.gym).toBeGreaterThan(0);
    });

    it('should return isInside: false and no currentAttendance when user is outside', async () => {
      const userId = 'user-123';
      attendanceRepository.findOne.mockResolvedValue(null);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      attendanceRepository.count.mockResolvedValue(0);

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.isInside).toBe(false);
      expect(result.currentAttendance).toBeUndefined();
      expect(result.availableAttendances.gym).toBeGreaterThan(0);
    });

    it('should return zero available attendances when user has no active subscription', async () => {
      const userId = 'user-123';
      attendanceRepository.findOne.mockResolvedValue(null);
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.availableAttendances.gym).toBe(0);
      expect(result.availableAttendances.classes).toBe(0);
    });

    it('should return zero available attendances when user has no memberships', async () => {
      const userId = 'user-123';
      const subscriptionWithoutMemberships = { ...mockSubscription, memberships: [] };
      attendanceRepository.findOne.mockResolvedValue(null);
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithoutMemberships);

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.availableAttendances.gym).toBe(0);
      expect(result.availableAttendances.classes).toBe(0);
    });

    it('should calculate available attendances correctly considering used passes', async () => {
      const userId = 'user-123';
      const subscriptionWithLimitedPasses = { 
        ...mockSubscription, 
        memberships: [{ ...mockMembership, max_gym_assistance: 10, max_classes_assistance: 5 }] 
      };
      
      attendanceRepository.findOne.mockResolvedValue(null);
      subscriptionRepository.findOne.mockResolvedValue(subscriptionWithLimitedPasses);
      attendanceRepository.count
        .mockResolvedValueOnce(3)  // 3 gym attendances used
        .mockResolvedValueOnce(2); // 2 class attendances used

      const result = await service.getUserAttendanceStatus(userId);

      expect(result.availableAttendances.gym).toBe(7);  // 10 - 3
      expect(result.availableAttendances.classes).toBe(3);  // 5 - 2
    });
  });

  describe('getUserAttendanceHistory', () => {
    const userId = 'user-123';
    const attendances = [mockAttendance];

    it('should get user attendance history without filters', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue(attendances);

      const result = await service.getUserAttendanceHistory(userId, {});
      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        order: { entranceDatetime: 'DESC' },
      });
    });

    it('should get user attendance history with type filter', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue(attendances);

      const result = await service.getUserAttendanceHistory(userId, { type: AttendanceType.GYM });
      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: AttendanceType.GYM },
        order: { entranceDatetime: 'DESC' },
      });
    });

    it('should get user attendance history with date filters', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue(attendances);
      const from = '2025-10-01';
      const to = '2025-10-31';

      const result = await service.getUserAttendanceHistory(userId, { from, to });
      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          entranceDatetime: Between(new Date(from), new Date(to + 'T23:59:59.999Z')),
        },
        order: { entranceDatetime: 'DESC' },
      });
    });

    it('should get user attendance history with only from date', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue(attendances);
      const from = '2025-10-01';

      const result = await service.getUserAttendanceHistory(userId, { from });
      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          entranceDatetime: MoreThanOrEqual(new Date(from)),
        },
        order: { entranceDatetime: 'DESC' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getUserAttendanceHistory('invalid-user', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveAttendances', () => {
    it('should return active attendances', async () => {
      const attendances = [mockAttendance];
      attendanceRepository.find.mockResolvedValue(attendances);

      const result = await service.getActiveAttendances();
      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['user'],
        order: { entranceDatetime: 'DESC' },
      });
    });
  });

  describe('getUserAttendanceStats', () => {
    const userId = 'user-123';
    const baseDate = new Date('2025-10-27T10:00:00.000Z');

    it('should return attendance stats for a user with mixed attendance types', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue([
        { ...mockAttendance, type: AttendanceType.GYM, entranceDatetime: baseDate },
        { ...mockAttendance, type: AttendanceType.CLASS, entranceDatetime: new Date(baseDate.getTime() + 86400000) }, // Next day
        { ...mockAttendance, type: AttendanceType.GYM, entranceDatetime: new Date(baseDate.getTime() + 172800000) }, // Two days later
      ]);

      const result = await service.getUserAttendanceStats(userId);

      expect(result.totalGymAttendances).toBe(2);
      expect(result.totalClassAttendances).toBe(1);
      expect(result.monthlyStats).toBeDefined();
      expect(result.monthlyStats.length).toBe(1); // All in same month
      expect(result.monthlyStats[0]).toEqual({
        month: '2025-10',
        gymCount: 2,
        classCount: 1,
      });
    });

    it('should return stats with multiple months', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue([
        { ...mockAttendance, type: AttendanceType.GYM, entranceDatetime: new Date('2025-10-27T10:00:00.000Z') },
        { ...mockAttendance, type: AttendanceType.CLASS, entranceDatetime: new Date('2025-11-15T10:00:00.000Z') },
        { ...mockAttendance, type: AttendanceType.GYM, entranceDatetime: new Date('2025-11-27T10:00:00.000Z') },
      ]);

      const result = await service.getUserAttendanceStats(userId);

      expect(result.totalGymAttendances).toBe(2);
      expect(result.totalClassAttendances).toBe(1);
      expect(result.monthlyStats).toBeDefined();
      expect(result.monthlyStats.length).toBe(2); // Two different months
      expect(result.monthlyStats).toEqual([
        { month: '2025-10', gymCount: 1, classCount: 0 },
        { month: '2025-11', gymCount: 1, classCount: 1 },
      ]);
    });

    it('should handle empty attendance history', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue([]);

      const result = await service.getUserAttendanceStats(userId);

      expect(result.totalGymAttendances).toBe(0);
      expect(result.totalClassAttendances).toBe(0);
      expect(result.monthlyStats).toEqual([]);
    });

    it('should handle attendance across year boundary', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      const decemberAttendance = { 
        ...mockAttendance, 
        type: AttendanceType.GYM, 
        entranceDatetime: new Date('2025-12-31T23:59:59.999Z'),
        dateKey: '2025-12-31'
      };
      const januaryAttendance = { 
        ...mockAttendance, 
        type: AttendanceType.CLASS, 
        entranceDatetime: new Date('2026-01-01T00:00:00.000Z'),
        dateKey: '2026-01-01'
      };
      
      attendanceRepository.find.mockResolvedValue([
        decemberAttendance,
        januaryAttendance
      ]);

      const result = await service.getUserAttendanceStats(userId);

      expect(result.totalGymAttendances).toBe(1);
      expect(result.totalClassAttendances).toBe(1);
      expect(result.monthlyStats.sort((a, b) => a.month.localeCompare(b.month))).toEqual([
        { month: '2025-12', gymCount: 1, classCount: 0 },
        { month: '2026-01', gymCount: 0, classCount: 1 },
      ]);
    });

    it('should handle attendance at exact month boundaries', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      const octoberAttendance = {
        ...mockAttendance,
        type: AttendanceType.GYM, 
        entranceDatetime: new Date('2025-10-31T23:59:59.999Z'),
        dateKey: '2025-10-31'
      };
      const novemberAttendance = {
        ...mockAttendance,
        type: AttendanceType.CLASS, 
        entranceDatetime: new Date('2025-11-01T00:00:00.000Z'),
        dateKey: '2025-11-01'
      };
      
      attendanceRepository.find.mockResolvedValue([
        octoberAttendance,
        novemberAttendance
      ]);

      const result = await service.getUserAttendanceStats(userId);

      expect(result.totalGymAttendances).toBe(1);
      expect(result.totalClassAttendances).toBe(1);
      expect(result.monthlyStats.sort((a, b) => a.month.localeCompare(b.month))).toEqual([
        { month: '2025-10', gymCount: 1, classCount: 0 },
        { month: '2025-11', gymCount: 0, classCount: 1 },
      ]);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getUserAttendanceStats('invalid-user')).rejects.toThrow(NotFoundException);
    });
  });



  describe('getActiveAttendances', () => {
    it('should return all active attendances', async () => {
      const activeAttendances = [
        { ...mockAttendance, isActive: true },
        { ...mockAttendance, id: 'attendance-456', isActive: true }
      ];

      attendanceRepository.find.mockResolvedValue(activeAttendances);

      const result = await service.getActiveAttendances();

      expect(result).toEqual(activeAttendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['user'],
        order: { entranceDatetime: 'DESC' }
      });
    });
  });

  describe('edge case branches', () => {
    it('should handle checkIn when user has no subscription', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: new Date('2025-10-27T10:00:00.000Z').toISOString(),
        dateKey: '2025-10-27',
      };
      
      userRepository.findOneBy.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(null);

      // The service will actually check for passes first, so we expect ForbiddenException
      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ForbiddenException);
    });

    it('should handle checkOut when user has no active attendance', async () => {
      const userId = 'user-123';
      
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.findOne.mockResolvedValue(null);

      // The actual service throws NotFoundException with message "El usuario no tiene un check-in activo."
      await expect(service.checkOut(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user already inside during checkIn', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: AttendanceType.GYM,
        entranceDatetime: new Date('2025-10-27T10:00:00.000Z').toISOString(),
        dateKey: '2025-10-27',
      };
      
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(1); // User is already inside

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when user does not exist for getUserAttendanceHistory', async () => {
      const userId = 'invalid-user';
      const queryParams = {};
      
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getUserAttendanceHistory(userId, queryParams)).rejects.toThrow(NotFoundException);
    });

    it('should handle getUserAttendanceHistory with date range', async () => {
      const userId = 'user-123';
      const queryParams = { 
        from: '2025-10-01',
        to: '2025-10-31',
        type: AttendanceType.CLASS
      };
      
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue([]);

      const result = await service.getUserAttendanceHistory(userId, queryParams);
      
      expect(result).toEqual([]);
    });

    it('should handle getUserAttendanceHistory with only from date', async () => {
      const userId = 'user-123';
      const queryParams = { from: '2025-10-01' };
      
      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      const result = await service.getUserAttendanceHistory(userId, queryParams);
      
      expect(result).toEqual([mockAttendance]);
    });

    it('should handle subscription with empty memberships array', async () => {
      const userId = 'user-123';
      
      attendanceRepository.findOne.mockResolvedValue(null);
      subscriptionRepository.findOne.mockResolvedValue({
        ...mockSubscription,
        memberships: []
      });

      const result = await service.getUserAttendanceStatus(userId);
      
      expect(result.isInside).toBe(false);
      expect(result.availableAttendances).toEqual({ gym: 0, classes: 0 });
    });
  });
});
