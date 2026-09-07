import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ name: 'workshop_id', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workshop_id!: number;
}
