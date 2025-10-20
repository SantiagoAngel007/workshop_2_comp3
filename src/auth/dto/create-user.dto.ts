import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsString()
    email:string;

    @IsString()
    fullName:string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password:string;

}
