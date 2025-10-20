import { IsEmail, IsInt, IsNotEmpty, IsString, Max, Min, MinLength, MaxLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsInt()
    @Min(1)
    @Max(120)
    age: number; 

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;

    
}