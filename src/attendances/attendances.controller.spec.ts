import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { mockAttendance } from '../../test/utils/test-utils';

describe('AttendancesController', () => {
  let controller: AttendancesController;
  let attendancesService: AttendancesService;

  const mockAttendancesService = {
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    getAvailableAttendances: jest.fn(),
    getAttendanceHistory: jest.fn(),
    getAttendanceStats: jest.fn(),
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

      const result = await controller.checkIn(createAttendanceDto);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.checkIn).toHaveBeenCalledWith(createAttendanceDto);
    });
  });

  describe('checkOut', () => {
    it('should check out user', async () => {
      const checkOutDto = { userId: 'user-123' };
      const expectedResult = { ...mockAttendance, checkOut: new Date() };

      mockAttendancesService.checkOut.mockResolvedValue(expectedResult);

      const result = await controller.checkOut(checkOutDto);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.checkOut).toHaveBeenCalledWith(checkOutDto);
    });
  });

  describe('getAvailableAttendances', () => {
    it('should return available attendances', async () => {
      const userId = 'user-123';
      const expectedResult = { gym: 25, classes: 5 };

      mockAttendancesService.getAvailableAttendances.mockResolvedValue(expectedResult);

      const result = await controller.getAvailableAttendances(userId);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.getAvailableAttendances).toHaveBeenCalledWith(userId);
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

      mockAttendancesService.getAttendanceHistory.mockResolvedValue(expectedResult);

      const result = await controller.getAttendanceHistory(getHistoryDto);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.getAttendanceHistory).toHaveBeenCalledWith(getHistoryDto);
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

      mockAttendancesService.getAttendanceStats.mockResolvedValue(expectedResult);

      const result = await controller.getAttendanceStats(userId);

      expect(result).toEqual(expectedResult);
      expect(attendancesService.getAttendanceStats).toHaveBeenCalledWith(userId);
    });
  });
});
