import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({
    description: 'The name of the membership plan',
    example: 'Gold Plan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The cost of the membership',
    example: 99.99,
  })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({
    description:
      'The maximum number of classes a member can attend with this plan',
    example: 10,
  })
  @IsInt()
  @Min(0)
  max_classes_assistance: number;

  @ApiProperty({
    description: 'The maximum number of general gym visits allowed',
    example: 20,
  })
  @IsInt()
  @Min(0)
  max_gym_assistance: number;

  @ApiProperty({
    description:
      'The duration of the membership in months. Must be 1 (monthly) or 12 (yearly).',
    example: 1,
  })
  @IsInt()
  @IsIn([1, 12], {
    message: 'La duración debe ser 1 mes (mensual) o 12 meses (anual)',
  })
  duration_months: number;

  @ApiProperty({
    description: 'The initial status of the membership (active/inactive)',
    example: true,
    required: false, // Marks this property as optional in Swagger UI
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
