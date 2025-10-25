import { IsUUID } from 'class-validator';

export class AddMembershipDto {
  @IsUUID()
  membershipId: string;
}
