import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1788760000000 implements MigrationInterface {
  name = 'CreateInitialSchema1788760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('user', 'admin')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "workshops" (
        "id" SERIAL NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "capacity" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_workshops_capacity" CHECK ("capacity" > 0),
        CONSTRAINT "UQ_workshops_title" UNIQUE ("title"),
        CONSTRAINT "PK_workshops" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "workshop_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_bookings_user_workshop"
          UNIQUE ("user_id", "workshop_id"),
        CONSTRAINT "PK_bookings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_workshop" FOREIGN KEY ("workshop_id")
          REFERENCES "workshops"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "bookings"');
    await queryRunner.query('DROP TABLE "workshops"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE "user_role_enum"');
  }
}
