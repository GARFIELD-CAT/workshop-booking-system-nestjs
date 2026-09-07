import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from '../auth/dto/register.dto';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';

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
});
