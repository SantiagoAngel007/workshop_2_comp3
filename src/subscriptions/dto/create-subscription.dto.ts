
import { IsString, IsNumber, IsInt, IsDate, Min, IsArray, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
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
  @Min(1)
  duration_months: number;

  @IsDate()
  purchase_date: Date;

  @IsArray()
  @IsUUID('4', { each: true })
  membershipIds: string[];
}
