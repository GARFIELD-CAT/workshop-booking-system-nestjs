import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Workshop Booking API (e2e)', () => {
  let app: INestApplication;
  let adminAccess: string;
  let firstUserAccess: string;
  let secondUserAccess: string;
  let workshopId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const runId = Date.now().toString();
    const firstEmail = `parallel_first_${runId}@example.com`;
    const secondEmail = `parallel_second_${runId}@example.com`;
    const password = 'studentPass';

    const adminLogin = await request(app.getHttpServer())
      .post('/api/token/')
      .send({ email: 'admin@example.com', password: 'admin' })
      .expect(200);
    adminAccess = adminLogin.body.access as string;

    await request(app.getHttpServer())
      .post('/api/register/')
      .send({
        email: firstEmail,
        username: `parallel_first_${runId}`,
        password,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/register/')
      .send({
        email: secondEmail,
        username: `parallel_second_${runId}`,
        password,
      })
      .expect(201);

    const firstLogin = await request(app.getHttpServer())
      .post('/api/token/')
      .send({ email: firstEmail, password })
      .expect(200);
    const secondLogin = await request(app.getHttpServer())
      .post('/api/token/')
      .send({ email: secondEmail, password })
      .expect(200);
    firstUserAccess = firstLogin.body.access as string;
    secondUserAccess = secondLogin.body.access as string;

    const workshop = await request(app.getHttpServer())
      .post('/api/workshops/')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({
        title: `Проверка параллельной записи ${runId}`,
        description: 'Мастер-класс с одним свободным местом.',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        capacity: 1,
      })
      .expect(201);
    workshopId = workshop.body.id as number;
  });

  afterAll(async () => {
    if (workshopId !== undefined) {
      await request(app.getHttpServer())
        .delete(`/api/workshops/${workshopId}/`)
        .set('Authorization', `Bearer ${adminAccess}`);
    }

    await app.close();
  });

  it('allows public access to the workshop list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/workshops/')
      .expect(200);

    expect(response.body.results).toBeInstanceOf(Array);
  });

  it('does not let a regular user create a workshop', async () => {
    await request(app.getHttpServer())
      .post('/api/workshops/')
      .set('Authorization', `Bearer ${firstUserAccess}`)
      .send({
        title: 'Недоступный мастер-класс',
        description: 'Этот запрос должен быть отклонён.',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        capacity: 10,
      })
      .expect(403);
  });

  it('creates only one booking when two users request the last place', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/bookings/')
        .set('Authorization', `Bearer ${firstUserAccess}`)
        .send({ workshop_id: workshopId }),
      request(app.getHttpServer())
        .post('/api/bookings/')
        .set('Authorization', `Bearer ${secondUserAccess}`)
        .send({ workshop_id: workshopId }),
    ]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 400]);

    const successfulResponse = responses.find(
      (response) => response.status === 201,
    );
    expect(successfulResponse?.body.workshop.id).toBe(workshopId);
  });
});
