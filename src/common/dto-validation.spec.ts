import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from '../auth/dto/register.dto';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { CreateWorkshopDto } from '../workshops/dto/create-workshop.dto';

describe('DTO compatibility', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('accepts a role during registration so the service can ignore it', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'student@example.com',
      username: 'student',
      password: 'studentPass',
      role: 'admin',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    await expect(
      validationPipe.transform(dto, {
        type: 'body',
        metatype: RegisterDto,
      }),
    ).resolves.toBeInstanceOf(RegisterDto);
  });

  it('accepts a user id during booking so the service can ignore it', async () => {
    const dto = plainToInstance(CreateBookingDto, {
      workshop_id: 1,
      user: 999,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    await expect(
      validationPipe.transform(dto, {
        type: 'body',
        metatype: CreateBookingDto,
      }),
    ).resolves.toBeInstanceOf(CreateBookingDto);
  });

  it('rejects a workshop date without an explicit timezone', async () => {
    const dto = plainToInstance(CreateWorkshopDto, {
      title: 'NestJS для начинающих',
      description: 'Практический мастер-класс',
      date: '2030-01-10T15:00:00',
      capacity: 10,
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'date' })]),
    );
  });

  it.each(['2030-01-10T15:00:00Z', '2030-01-10T15:00:00+03:00'])(
    'accepts a workshop date with an explicit timezone: %s',
    async (date) => {
      const dto = plainToInstance(CreateWorkshopDto, {
        title: 'NestJS для начинающих',
        description: 'Практический мастер-класс',
        date,
        capacity: 10,
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );
});
