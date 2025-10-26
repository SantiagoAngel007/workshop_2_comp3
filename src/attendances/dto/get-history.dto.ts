import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';

export class GetHistoryDto {
  @IsOptional()
  @IsDateString()
  readonly from?: string;

  @IsOptional()
  @IsDateString()
  readonly to?: string;

  @IsOptional()
  @IsEnum(AttendanceType)
  readonly type?: AttendanceType;
}
