import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
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
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'Дата должна содержать часовой пояс: Z или смещение вида +03:00.',
  })
  date!: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;
}
