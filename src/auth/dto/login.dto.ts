import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty({
        description: "The user's email for login",
        example: 'john.doe@example.com',
    })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: "The user's password",
        example: 'Password123',
        minLength: 6,
        maxLength: 50,
    })

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;
}