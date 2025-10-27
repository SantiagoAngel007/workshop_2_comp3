import { IsUUID } from 'class-validator';

export class CheckOutDto {
  @IsUUID()
  readonly userId: string;
}
