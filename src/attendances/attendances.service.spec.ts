import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesService } from './attendances.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { createMockRepository, mockUser, mockSubscription } from '../../test/utils/test-utils';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let attendanceRepository: any;
  let userRepository: any;
  let subscriptionRepository: any;

  const mockAttendance = {
    id: 'attendance-123',
    user: mockUser,
    type: 'gym',
    checkIn: new Date('2025-10-27T10:00:00.000Z'),
    checkOut: null,
    isActive: true,
    created_at: new Date('2025-10-27T10:00:00.000Z'),
    updated_at: new Date('2025-10-27T10:00:00.000Z'),
  };

  beforeEach(async () => {
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

      userRepository.findOneBy.mockResolvedValue(mockUser);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      attendanceRepository.findOne.mockResolvedValue(null);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);
      
      // Mock validateUserCanEnter to return true
      jest.spyOn(service as any, 'validateUserCanEnter').mockResolvedValue(true);

      const result = await service.checkIn(createAttendanceDto);

      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if user not found', async () => {
      const createAttendanceDto = {
        userId: 'invalid-user',
        type: 'gym' as any,
      };

      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.checkIn(createAttendanceDto)).rejects.toThrow(NotFoundException);
    });
  });




  describe('checkOut', () => {
    it('should check out user successfully', async () => {
      const userId = 'user-123';
      const checkedOutAttendance = { ...mockAttendance, checkOut: new Date('2025-10-27T10:00:00.000Z'), isActive: false };

      userRepository.findOneBy.mockResolvedValue(mockUser);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(checkedOutAttendance);

      const result = await service.checkOut({ userId });

      expect(result).toEqual(checkedOutAttendance);
    });
  });

  describe('validateUserExists', () => {
    it('should return user if exists', async () => {
      const userId = 'user-123';
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.validateUserExists(userId);

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'invalid-user';
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.validateUserExists(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
