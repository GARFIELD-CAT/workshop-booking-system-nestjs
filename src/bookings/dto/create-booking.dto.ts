import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ name: 'workshop_id', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workshop_id!: number;

  @ApiPropertyOptional({ description: 'Игнорируется сервером' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  user?: number;
}
