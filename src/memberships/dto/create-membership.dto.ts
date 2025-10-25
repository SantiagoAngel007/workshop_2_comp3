import { IsString, IsNumber, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateMembershipDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsInt()
  @Min(0)
  max_classes_assistance: number;

  @IsInt()
  @Min(0)
  max_gym_assistance: number;

  @IsInt()
  @Min(1)
  duration_months: number;
}
