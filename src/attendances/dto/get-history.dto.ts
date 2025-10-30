import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetHistoryDto {
  @ApiPropertyOptional({
    description:
      'Filter history from this ISO 8601 date. Records on or after this date will be returned.',
    example: '2025-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  readonly from?: string;

  @ApiPropertyOptional({
    description:
      'Filter history up to this ISO 8601 date. Records on or before this date will be returned.',
    example: '2025-10-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  readonly to?: string;

  @ApiPropertyOptional({
    description: 'Filter by the type of attendance.',
    enum: AttendanceType,
    example: AttendanceType.CLASS,
  })
  @IsOptional()
  @IsEnum(AttendanceType)
  readonly type?: AttendanceType;
}
