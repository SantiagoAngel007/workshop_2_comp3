import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  IsDate,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'A descriptive name for the subscription or associated plan.',
    example: 'Premium Annual Subscription',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The cost associated with this subscription.',
    example: 299.99,
  })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({
    description: 'Maximum number of class attendances allowed.',
    example: 20,
  })
  @IsInt()
  @Min(0)
  max_classes_assistance: number;

  @ApiProperty({
    description: 'Maximum number of general gym attendances allowed.',
    example: 50,
  })
  @IsInt()
  @Min(0)
  max_gym_assistance: number;

  @ApiProperty({
    description: 'The duration of the subscription in months.',
    example: 12,
  })
  @IsInt()
  @Min(1)
  duration_months: number;

  @ApiProperty({
    description: 'The date the subscription was purchased.',
    example: '2025-10-28T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDate()
  purchase_date: Date;

  @ApiProperty({
    description:
      'An array of membership UUIDs to associate with this subscription.',
    example: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  membershipIds: string[];
}
