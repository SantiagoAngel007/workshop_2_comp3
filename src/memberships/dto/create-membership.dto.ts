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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsInt()
  @Min(0)
  max_classes_assistance: number;

  @IsInt()
  @Min(0)
  max_gym_assistance: number;

  @IsInt()
  @IsIn([1, 12], {
    message: 'La duración debe ser 1 mes (mensual) o 12 meses (anual)',
  })
  duration_months: number;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
