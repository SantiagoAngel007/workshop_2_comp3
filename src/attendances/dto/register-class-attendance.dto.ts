import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterClassAttendanceDto {
  @ApiProperty({
    description: 'The unique identifier (UUID) of the user attending the class.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  readonly userId: string;

  @ApiProperty({
    description: 'The unique identifier (UUID) of the class.',
    example: 'b2c3d4e5-f6a7-8901-2345-678901bcdefg',
  })
  @IsUUID()
  readonly classId: string;

  @ApiProperty({
    description: 'Optional notes from the coach about the attendance.',
    example: 'First class, good performance',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly notes?: string;
}
