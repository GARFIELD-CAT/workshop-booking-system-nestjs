import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, QueryFailedError, Repository } from 'typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop } from './entities/workshop.entity';

const PAGE_SIZE = 10;

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopsRepository: Repository<Workshop>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(page: number): Promise<PaginatedResponse<Workshop>> {
    const [workshops, count] = await this.workshopsRepository
      .createQueryBuilder('workshop')
      .orderBy('workshop.date', 'ASC')
      .addOrderBy('workshop.id', 'ASC')
      .skip((page - 1) * PAGE_SIZE)
      .take(PAGE_SIZE)
      .getManyAndCount();

    return {
      count,
      next:
        page * PAGE_SIZE < count ? `/api/workshops/?page=${page + 1}` : null,
      previous: page > 1 ? `/api/workshops/?page=${page - 1}` : null,
      results: workshops,
    };
  }

  async findOne(id: number): Promise<Workshop> {
    const workshop = await this.workshopsRepository.findOneBy({ id });

    if (workshop === null) {
      throw new NotFoundException('Мастер-класс не найден.');
    }

    return workshop;
  }

  async create(dto: CreateWorkshopDto): Promise<Workshop> {
    const titleExists = await this.workshopsRepository.existsBy({
      title: dto.title,
    });

    if (titleExists) {
      throw this.duplicateTitleError();
    }

    const workshop = this.workshopsRepository.create({
      ...dto,
      date: new Date(dto.date),
    });

    try {
      return await this.workshopsRepository.save(workshop);
    } catch (error: unknown) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  update(id: number, dto: UpdateWorkshopDto): Promise<Workshop> {
    // Блокировка внутри транзакции не даёт одновременно уменьшить
    // вместимость и создать новую бронь.
    return this.dataSource.transaction(async (manager) => {
      const workshopsRepository = manager.getRepository(Workshop);
      const workshop = await workshopsRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (workshop === null) {
        throw new NotFoundException('Мастер-класс не найден.');
      }

      if (dto.title !== undefined && dto.title !== workshop.title) {
        const titleExists = await workshopsRepository.existsBy({
          id: Not(id),
          title: dto.title,
        });

        if (titleExists) {
          throw this.duplicateTitleError();
        }
      }

      if (dto.capacity !== undefined) {
        const bookingCount = await manager.getRepository(Booking).count({
          where: { workshop: { id } },
        });

        if (dto.capacity < bookingCount) {
          throw new BadRequestException({
            capacity: 'Вместимость меньше количества существующих броней.',
          });
        }
      }

      Object.assign(workshop, dto);

      if (dto.date !== undefined) {
        workshop.date = new Date(dto.date);
      }

      try {
        return await workshopsRepository.save(workshop);
      } catch (error: unknown) {
        this.handleUniqueViolation(error);
        throw error;
      }
    });
  }

  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Workshop);
      const workshop = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (workshop === null) {
        throw new NotFoundException('Мастер-класс не найден.');
      }

      await repository.remove(workshop);
    });
  }

  private duplicateTitleError(): BadRequestException {
    return new BadRequestException({
      title: ['Мастер-класс с таким названием уже существует.'],
    });
  }

  private handleUniqueViolation(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const driverError = error.driverError as { code?: string };

    if (driverError.code === '23505') {
      throw this.duplicateTitleError();
    }
  }
}
