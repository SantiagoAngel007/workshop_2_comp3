/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesService } from './attendances.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import {
  createMockRepository,
  mockUser,
  mockSubscription,
} from '../../test/utils/test-utils';
import {
  NotFoundException,
  ConflictException,
  // ForbiddenException,
} from '@nestjs/common';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let attendanceRepository: any;
  let userRepository: any;
  let subscriptionRepository: any;

  const mockAttendance = {
    id: 'attendance-123',
    user: mockUser,
    type: 'gym',
    checkIn: new Date(),
    checkOut: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
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
    attendanceRepository = module.get(getRepositoryToken(Attendance));
    userRepository = module.get(getRepositoryToken(User));
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIn', () => {
    it('should create attendance check-in successfully', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: 'gym' as any,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      attendanceRepository.findOne.mockResolvedValue(null);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      const result = await service.checkIn(createAttendanceDto);

      expect(result).toEqual(mockAttendance);
      expect(attendanceRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const createAttendanceDto = {
        userId: 'invalid-user',
        type: 'gym' as any,
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user already checked in', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: 'gym' as any,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('checkOut', () => {
    it('should check out user successfully', async () => {
      const userId = 'user-123';
      const checkedOutAttendance = { ...mockAttendance, checkOut: new Date() };

      userRepository.findOne.mockResolvedValue(mockUser);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(checkedOutAttendance);

      const result = await service.checkOut({ userId });

      expect(result).toEqual(checkedOutAttendance);
      expect(attendanceRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no active attendance found', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      attendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.checkOut({ userId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAvailableAttendances', () => {
    it('should return available attendances for user', async () => {
      const userId = 'user-123';
      const expectedResponse = {
        gym: 25,
        classes: 5,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      attendanceRepository.count.mockResolvedValue(5);

      const result = await service.getAvailableAttendances(userId);

      expect(result).toHaveProperty('gym');
      expect(result).toHaveProperty('classes');
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'invalid-user';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getAvailableAttendances(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAttendanceHistory', () => {
    it('should return attendance history for user', async () => {
      const getHistoryDto = {
        userId: 'user-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const attendances = [mockAttendance];

      userRepository.findOne.mockResolvedValue(mockUser);
      attendanceRepository.find.mockResolvedValue(attendances);

      const result = await service.getAttendanceHistory(getHistoryDto);

      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalled();
    });
  });

  describe('getAttendanceStats', () => {
    it('should return attendance statistics', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      attendanceRepository.count.mockResolvedValue(10);

      const result = await service.getAttendanceStats(userId);

      expect(result).toHaveProperty('totalAttendances');
      expect(result).toHaveProperty('thisMonth');
      expect(result).toHaveProperty('thisWeek');
    });
  });
});
