import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddMembershipDto {
  @ApiProperty({
    description:
      'The unique identifier (UUID) of the membership to add to the subscription.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  membershipId: string;
}
