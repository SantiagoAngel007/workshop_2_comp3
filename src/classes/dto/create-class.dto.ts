import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    description: 'The name of the class',
    example: 'Spinning 6:00 PM',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({
    description: 'Description of the class',
    example: 'High-intensity indoor cycling class',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiProperty({
    description: 'Duration of the class in minutes',
    example: 60,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly duration_minutes?: number;

  @ApiProperty({
    description: 'Maximum number of attendees allowed',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly max_capacity?: number;

  @ApiProperty({
    description: 'Whether the class is currently active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
