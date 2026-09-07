import { DataSource, EntityManager, Repository } from 'typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { Workshop } from './entities/workshop.entity';
import { WorkshopsService } from './workshops.service';

describe('WorkshopsService', () => {
  const create = jest.fn();
  const save = jest.fn();
  const existsBy = jest.fn();
  const findOne = jest.fn();
  const count = jest.fn();
  let service: WorkshopsService;

  beforeEach(() => {
    jest.clearAllMocks();
    const workshopRepository = {
      create,
      save,
      existsBy,
      findOne,
    } as unknown as Repository<Workshop>;
    const bookingRepository = { count } as unknown as Repository<Booking>;
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

    service = new WorkshopsService(workshopRepository, dataSource);
  });

  it('rejects a duplicate workshop title', async () => {
    existsBy.mockResolvedValue(true);

    await expect(
      service.create({
        title: 'NestJS для начинающих',
        description: 'Практический мастер-класс',
        date: '2030-01-10T12:00:00Z',
        capacity: 10,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects capacity below the current booking count', async () => {
    findOne.mockResolvedValue({
      id: 1,
      title: 'NestJS для начинающих',
      description: 'Практический мастер-класс',
      date: new Date('2030-01-10T12:00:00Z'),
      capacity: 10,
      created_at: new Date(),
      updated_at: new Date(),
      bookings: [],
    });
    existsBy.mockResolvedValue(false);
    count.mockResolvedValue(3);

    await expect(service.update(1, { capacity: 2 })).rejects.toMatchObject({
      status: 400,
    });
  });
});
