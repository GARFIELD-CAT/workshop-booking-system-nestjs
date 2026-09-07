import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { User } from '../users/entities/user.entity';
import { Workshop } from '../workshops/entities/workshop.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';

const PAGE_SIZE = 10;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(user: User, page: number): Promise<PaginatedResponse<Booking>> {
    const [bookings, count] = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.workshop', 'workshop')
      .where('user.id = :userId', { userId: user.id })
      .orderBy('booking.created_at', 'DESC')
      .addOrderBy('booking.id', 'DESC')
      .skip((page - 1) * PAGE_SIZE)
      .take(PAGE_SIZE)
      .getManyAndCount();

    return {
      count,
      next: page * PAGE_SIZE < count ? `/api/bookings/?page=${page + 1}` : null,
      previous: page > 1 ? `/api/bookings/?page=${page - 1}` : null,
      results: bookings,
    };
  }

  async findOne(user: User, id: number): Promise<Booking> {
    const booking = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'bookingUser')
      .leftJoinAndSelect('booking.workshop', 'workshop')
      .where('booking.id = :id', { id })
      .andWhere('bookingUser.id = :userId', { userId: user.id })
      .getOne();

    if (booking === null) {
      throw new NotFoundException('Бронь не найдена.');
    }

    return booking;
  }

  create(user: User, dto: CreateBookingDto): Promise<Booking> {
    return this.saveBooking(user, dto.workshop_id);
  }

  update(user: User, id: number, dto: UpdateBookingDto): Promise<Booking> {
    if (dto.workshop_id === undefined) {
      return this.findOne(user, id);
    }

    return this.saveBooking(user, dto.workshop_id, id);
  }

  async remove(user: User, id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Booking);
      const booking = await repository.findOne({
        where: { id, user: { id: user.id } },
        relations: { workshop: true },
      });

      if (booking === null) {
        throw new NotFoundException('Бронь не найдена.');
      }

      // Блокировка мастер-класса согласована с созданием брони.
      await manager.getRepository(Workshop).findOne({
        where: { id: booking.workshop.id },
        lock: { mode: 'pessimistic_write' },
      });
      await repository.remove(booking);
    });
  }

  private saveBooking(
    user: User,
    workshopId: number,
    bookingId?: number,
  ): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      // Блокировка строки не позволяет двум запросам занять последнее место.
      const workshop = await manager.getRepository(Workshop).findOne({
        where: { id: workshopId },
        lock: { mode: 'pessimistic_write' },
      });

      if (workshop === null) {
        throw new BadRequestException({
          workshop_id: 'Выбранный мастер-класс не существует.',
        });
      }

      const repository = manager.getRepository(Booking);
      let booking: Booking | null = null;

      if (bookingId !== undefined) {
        booking = await repository
          .createQueryBuilder('booking')
          .innerJoinAndSelect('booking.user', 'bookingUser')
          .innerJoinAndSelect('booking.workshop', 'bookingWorkshop')
          .where('booking.id = :bookingId', { bookingId })
          .andWhere('bookingUser.id = :userId', { userId: user.id })
          .setLock('pessimistic_write')
          .getOne();

        if (booking === null) {
          throw new NotFoundException('Бронь не найдена.');
        }

        if (booking.workshop.id === workshop.id) {
          return booking;
        }
      }

      await this.validateBooking(manager, user, workshop, bookingId);

      if (booking === null) {
        booking = repository.create({ user, workshop });
      } else {
        booking.workshop = workshop;
      }

      try {
        return await repository.save(booking);
      } catch (error: unknown) {
        this.handleUniqueViolation(error);
        throw error;
      }
    });
  }

  private async validateBooking(
    manager: EntityManager,
    user: User,
    workshop: Workshop,
    bookingId?: number,
  ): Promise<void> {
    if (workshop.date.getTime() <= Date.now()) {
      throw new BadRequestException({
        workshop_id: 'Нельзя забронировать прошедший мастер-класс.',
      });
    }

    const repository = manager.getRepository(Booking);
    const where: FindOptionsWhere<Booking> = {
      user: { id: user.id },
      workshop: { id: workshop.id },
    };

    if (bookingId !== undefined) {
      where.id = Not(bookingId);
    }

    if (await repository.exists({ where })) {
      throw new BadRequestException({
        workshop_id: 'Вы уже записаны на этот мастер-класс.',
      });
    }

    const bookingCount = await repository.count({
      where: { workshop: { id: workshop.id } },
    });

    if (bookingCount >= workshop.capacity) {
      throw new BadRequestException({
        workshop_id: 'Все места на мастер-класс заняты.',
      });
    }
  }

  private handleUniqueViolation(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const driverError = error.driverError as { code?: string };

    if (driverError.code === '23505') {
      throw new BadRequestException({
        workshop_id: 'Вы уже записаны на этот мастер-класс.',
      });
    }
  }
}
