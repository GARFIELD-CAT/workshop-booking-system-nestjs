import { hash } from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDemoData1788760001000 implements MigrationInterface {
  name = 'SeedDemoData1788760001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [adminPassword, userPassword, user2Password] = await Promise.all([
      hash('admin', 10),
      hash('user', 10),
      hash('user2', 10),
    ]);

    await queryRunner.query(
      `
        INSERT INTO "users" ("email", "username", "password", "role")
        VALUES
          ('admin@example.com', 'admin', $1, 'admin'),
          ('user@example.com', 'user', $2, 'user'),
          ('user2@example.com', 'user2', $3, 'user')
      `,
      [adminPassword, userPassword, user2Password],
    );
    await queryRunner.query(`
      INSERT INTO "workshops"
        ("title", "description", "date", "capacity")
      VALUES
        (
          'Создание REST API на Django',
          'Создание учебного API с Django REST Framework.',
          now() + interval '30 days',
          10
        ),
        (
          'Основы публичных выступлений',
          'Структура речи и работа с волнением.',
          now() + interval '60 days',
          15
        ),
        (
          'Мобильная фотография',
          'Настройка камеры смартфона и основы композиции.',
          now() + interval '90 days',
          10
        ),
        (
          'Эффективное управление временем',
          'Планирование задач и расстановка приоритетов.',
          now() + interval '120 days',
          12
        )
    `);
    await queryRunner.query(`
      INSERT INTO "bookings" ("user_id", "workshop_id")
      SELECT "users"."id", "workshops"."id"
      FROM "users"
      CROSS JOIN "workshops"
      WHERE
        ("users"."email" = 'user@example.com'
          AND "workshops"."title" = 'Создание REST API на Django')
        OR ("users"."email" = 'user2@example.com'
          AND "workshops"."title" = 'Создание REST API на Django')
        OR ("users"."email" = 'user@example.com'
          AND "workshops"."title" = 'Основы публичных выступлений')
        OR ("users"."email" = 'admin@example.com'
          AND "workshops"."title" = 'Мобильная фотография')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "workshops"
      WHERE "title" IN (
        'Создание REST API на Django',
        'Основы публичных выступлений',
        'Мобильная фотография',
        'Эффективное управление временем'
      )
    `);
    await queryRunner.query(`
      DELETE FROM "users"
      WHERE "email" IN (
        'admin@example.com',
        'user@example.com',
        'user2@example.com'
      )
    `);
  }
}
