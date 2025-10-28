import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CheckOutDto {
  @ApiProperty({
    description: "The unique identifier (UUID) of the user to check out.",
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  readonly userId: string;
}
