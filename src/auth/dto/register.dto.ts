import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum';

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

  @ApiPropertyOptional({ enum: UserRole, description: 'Игнорируется сервером' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
