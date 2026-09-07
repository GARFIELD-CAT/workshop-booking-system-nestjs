import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'student' })
  @IsString()
  @Length(1, 150)
  username!: string;

  @ApiProperty({ example: 'studentPass', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
