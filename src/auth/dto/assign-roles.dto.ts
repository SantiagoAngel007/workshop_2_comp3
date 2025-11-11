import { IsArray, ArrayMinSize, IsEnum, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidRoles } from '../enums/roles.enum';

export class AssignRolesDto {
  @ApiProperty({
    description: 'List of roles to assign to the user',
    example: ['admin', 'coach'],
    enum: ValidRoles,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one role must be provided' })
  @IsEnum(ValidRoles, { each: true, message: 'Each role must be a valid role' })
  roles: ValidRoles[];
}
