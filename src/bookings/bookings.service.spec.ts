import { DataSource, EntityManager, Repository } from 'typeorm';

import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { Workshop } from '../workshops/entities/workshop.entity';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const findWorkshop = jest.fn();
  const findBooking = jest.fn();
  const bookingExists = jest.fn();
  const bookingCount = jest.fn();
  const createBooking = jest.fn();
  const saveBooking = jest.fn();
  const user: User = {
    id: 1,
    email: 'student@example.com',
    username: 'student',
    password: 'unused',
    role: UserRole.User,
    bookings: [],
  };
  let service: BookingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    const workshopRepository = {
      findOne: findWorkshop,
    } as unknown as Repository<Workshop>;
    const bookingRepository = {
      findOne: findBooking,
      exists: bookingExists,
      count: bookingCount,
      create: createBooking,
      save: saveBooking,
    } as unknown as Repository<Booking>;
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Workshop ? workshopRepository : bookingRepository,
      ),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (work: (value: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;

    service = new BookingsService(bookingRepository, dataSource);
  });

  it('rejects booking for a past workshop', async () => {
    findWorkshop.mockResolvedValue({
      id: 1,
      date: new Date(Date.now() - 60_000),
      capacity: 10,
    });

    await expect(
      service.create(user, { workshop_id: 1 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a duplicate booking', async () => {
    findWorkshop.mockResolvedValue({
      id: 1,
      date: new Date(Date.now() + 60_000),
      capacity: 10,
    });
    bookingExists.mockResolvedValue(true);

    await expect(
      service.create(user, { workshop_id: 1 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects booking when capacity is exhausted', async () => {
    findWorkshop.mockResolvedValue({
      id: 1,
      date: new Date(Date.now() + 60_000),
      capacity: 1,
    });
    bookingExists.mockResolvedValue(false);
    bookingCount.mockResolvedValue(1);

    await expect(
      service.create(user, { workshop_id: 1 }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
