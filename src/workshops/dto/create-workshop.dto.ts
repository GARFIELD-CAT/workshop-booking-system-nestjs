import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Telegram-бот на Python' })
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ example: 'Создание простого Telegram-бота' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '2030-01-10T15:00:00Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;
}
