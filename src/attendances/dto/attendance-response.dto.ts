import { AttendanceType } from '../entities/attendance.entity';

export class AvailableAttendances {
  gym: number;
  classes: number;
}

export class CurrentAttendanceInfo {
  id: string;
  entranceDatetime: Date;
  type: AttendanceType;
}

export class AttendanceStatus {
  isInside: boolean;
  currentAttendance?: CurrentAttendanceInfo;
  availableAttendances: AvailableAttendances;
}

export class MonthlyStat {
  month: string;
  gymCount: number;
  classCount: number;
}

export class AttendanceStatsResponse {
  totalGymAttendances: number;
  totalClassAttendances: number;
  monthlyStats: MonthlyStat[];
}
