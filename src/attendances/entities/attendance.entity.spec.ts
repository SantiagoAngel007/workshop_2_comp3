import { Attendance, AttendanceType } from './attendance.entity';

describe('Attendance Entity', () => {
  let attendance: Attendance;
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    attendance = new Attendance();
    attendance.id = 'attendance-123';
    attendance.user = mockUser;
    attendance.type = AttendanceType.GYM;
    attendance.entranceDatetime = new Date('2025-10-27T10:00:00Z');
    attendance.dateKey = '2025-10-27';
    attendance.isActive = true;
    attendance.created_at = new Date('2025-10-27T10:00:00Z');
    attendance.updated_at = new Date('2025-10-27T10:00:00Z');
  });

  it('should create an attendance entity', () => {
    expect(attendance).toBeDefined();
    expect(attendance.id).toBe('attendance-123');
    expect(attendance.type).toBe(AttendanceType.GYM);
    expect(attendance.isActive).toBe(true);
    expect(attendance.dateKey).toBe('2025-10-27');
  });

  it('should handle null exitDatetime', () => {
    expect(attendance.exitDatetime).toBeUndefined();
    attendance.exitDatetime = new Date('2025-10-27T11:00:00Z');
    expect(attendance.exitDatetime).toBeDefined();
  });

  it('should handle both attendance types', () => {
    // Test GYM type
    attendance.type = AttendanceType.GYM;
    expect(attendance.type).toBe(AttendanceType.GYM);

    // Test CLASS type
    attendance.type = AttendanceType.CLASS;
    expect(attendance.type).toBe(AttendanceType.CLASS);
  });

  it('should handle user relationship', () => {
    expect(attendance.user).toBeDefined();
    expect(attendance.user.id).toBe('user-123');
    expect(attendance.user.email).toBe('test@example.com');
  });

  it('should handle date formats correctly', () => {
    const date = new Date('2025-10-27T10:00:00Z');
    attendance.entranceDatetime = date;
    attendance.dateKey = '2025-10-27';

    expect(attendance.entranceDatetime).toEqual(date);
    expect(attendance.dateKey).toBe('2025-10-27');
  });

  it('should handle setting to inactive', () => {
    attendance.isActive = false;
    expect(attendance.isActive).toBe(false);
  });

  it('should track created and updated dates', () => {
    const createdDate = new Date('2025-10-27T10:00:00Z');
    const updatedDate = new Date('2025-10-27T11:00:00Z');

    attendance.created_at = createdDate;
    attendance.updated_at = updatedDate;

    expect(attendance.created_at).toEqual(createdDate);
    expect(attendance.updated_at).toEqual(updatedDate);
  });

  it('should handle complete check-out process', () => {
    const exitTime = new Date('2025-10-27T11:00:00Z');
    attendance.exitDatetime = exitTime;
    attendance.isActive = false;

    expect(attendance.exitDatetime).toEqual(exitTime);
    expect(attendance.isActive).toBe(false);
  });

  describe('AttendanceType Enum', () => {
    it('should only accept valid attendance types', () => {
      const validTypes = Object.values(AttendanceType);
      expect(validTypes).toContain(AttendanceType.GYM);
      expect(validTypes).toContain(AttendanceType.CLASS);
      expect(validTypes.length).toBe(2);
    });

    it('should have correct string values', () => {
      expect(AttendanceType.GYM).toBe('gym');
      expect(AttendanceType.CLASS).toBe('class');
    });
  });
});