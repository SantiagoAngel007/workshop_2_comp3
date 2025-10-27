import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsDateString()
  readonly exitDatetime?: string;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
