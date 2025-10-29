import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { mockAttendance, mockUser } from '../../test/utils/test-utils';

describe('AttendancesController', () => {
  let controller: AttendancesController;
  let attendancesService: AttendancesService;

  const mockAttendancesService = {
    checkIn: jest.fn(),
    checkOut: jest.fn(), // This is the service method called by checkOutByReceptionist
    getUserAttendanceStatus: jest.fn(),
    getUserAttendanceHistory: jest.fn(),
    getUserAttendanceStats: jest.fn(),
    getActiveAttendances: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancesController],
      providers: [
        {
          provide: AttendancesService,
          useValue: mockAttendancesService,
        },
      ],
    }).compile();

    controller = module.get<AttendancesController>(AttendancesController);
    attendancesService = module.get<AttendancesService>(AttendancesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkIn', () => {
    it('should check in user', async () => {
      const createAttendanceDto = {
        userId: 'user-123',
        type: 'gym' as any,
      };
      const expectedResult = mockAttendance;

      mockAttendancesService.checkIn.mockResolvedValue(expectedResult);

      const result = await controller.checkIn(createAttendanceDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.checkIn).toHaveBeenCalledWith(createAttendanceDto);
    });
  });

  describe('checkOut', () => {
    it('should check out user', async () => {
      const checkOutDto = { userId: 'user-123' };
      const expectedResult = { ...mockAttendance, checkOut: new Date() };

      mockAttendancesService.checkOut.mockResolvedValue(expectedResult);

      const result = await controller.checkOutByReceptionist(checkOutDto);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.checkOut).toHaveBeenCalledWith(checkOutDto.userId);
    });
  });

  describe('getAvailableAttendances', () => {
    it('should return available attendances', async () => {
      const userId = 'user-123';
      const expectedResult = { gym: 25, classes: 5 };

      mockAttendancesService.getUserAttendanceStatus.mockResolvedValue(expectedResult);

      const result = await controller.getStatus(userId);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.getUserAttendanceStatus).toHaveBeenCalledWith(userId);
    });
  });

  describe('getAttendanceHistory', () => {
    it('should return attendance history', async () => {
      const getHistoryDto = {
        userId: 'user-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const expectedResult = [mockAttendance];

      mockAttendancesService.getUserAttendanceHistory.mockResolvedValue(expectedResult);

      const result = await controller.getHistory(getHistoryDto.userId, getHistoryDto);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.getUserAttendanceHistory).toHaveBeenCalledWith(getHistoryDto.userId, getHistoryDto);
    });
  });

  describe('getAttendanceStats', () => {
    it('should return attendance statistics', async () => {
      const userId = 'user-123';
      const expectedResult = {
        totalAttendances: 10,
        thisMonth: 5,
        thisWeek: 2,
      };

      mockAttendancesService.getUserAttendanceStats.mockResolvedValue(expectedResult);

      const result = await controller.getStats(userId);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.getUserAttendanceStats).toHaveBeenCalledWith(userId);
    });
  });
});
