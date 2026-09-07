import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export type PublicUser = Pick<User, 'id' | 'email' | 'username' | 'role'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const emailExists = await this.usersRepository.existsBy({
      email: data.email,
    });

    if (emailExists) {
      throw new BadRequestException({
        email: ['Пользователь с таким email уже существует.'],
      });
    }

    const usernameExists = await this.usersRepository.existsBy({
      username: data.username,
    });

    if (usernameExists) {
      throw new BadRequestException({
        username: ['Пользователь с таким username уже существует.'],
      });
    }

    const user = this.usersRepository.create({
      ...data,
      role: UserRole.User,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException({
          detail: 'Пользователь с такими данными уже существует.',
        });
      }

      throw error;
    }
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };

    return driverError.code === '23505';
  }
}
