import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({
        description: 'Defines if the user is active or inactive in the system.',
        example: false,
        required: false, // Indicates that this field is optional
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}