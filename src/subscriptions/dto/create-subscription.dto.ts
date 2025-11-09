import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsArray,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'The start date of the subscription.',
    example: '2025-01-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @ApiProperty({
    description:
      'An array of membership UUIDs to associate with this subscription.',
    example: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  membershipIds?: string[];
}
