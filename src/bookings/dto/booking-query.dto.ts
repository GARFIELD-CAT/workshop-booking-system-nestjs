import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class BookingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
}
