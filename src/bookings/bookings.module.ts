import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Workshop } from '../workshops/entities/workshop.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Workshop])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
