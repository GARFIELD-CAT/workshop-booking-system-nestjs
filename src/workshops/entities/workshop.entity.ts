import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Booking } from '../../bookings/entities/booking.entity';

@Entity('workshops')
@Check('CHK_workshops_capacity', '"capacity" > 0')
export class Workshop {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200, unique: true })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column({ type: 'integer' })
  capacity!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Booking, (booking) => booking.workshop)
  bookings!: Booking[];
}
