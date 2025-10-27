import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';

export class CreateAttendanceDto {
  @IsUUID()
  readonly userId: string;

  @IsDateString()
  readonly entranceDatetime: string;

  @IsOptional()
  @IsDateString()
  readonly exitDatetime?: string;

  @IsEnum(AttendanceType)
  readonly type: AttendanceType;

  @IsString()
  @MaxLength(50)
  readonly dateKey: string;
}
