import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @ApiProperty({
    description: "The unique identifier (UUID) of the user checking in.",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  readonly userId: string;

  @ApiProperty({
    description: 'The ISO 8601 timestamp for the check-in time.',
    example: '2025-10-28T09:00:00.000Z',
  })
  @IsDateString()
  readonly entranceDatetime: string;

  @ApiProperty({
    description: 'The ISO 8601 timestamp for the check-out time (optional).',
    example: '2025-10-28T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly exitDatetime?: string;

  @ApiProperty({
    description: 'The type of attendance.',
    enum: AttendanceType,
    example: AttendanceType.GYM,
  })
  @IsEnum(AttendanceType)
  readonly type: AttendanceType;

  @ApiProperty({
    description: 'A key representing the date of the attendance, typically in YYYY-MM-DD format.',
    example: '2025-10-28',
  })
  @IsString()
  @MaxLength(50)
  readonly dateKey: string;
}
