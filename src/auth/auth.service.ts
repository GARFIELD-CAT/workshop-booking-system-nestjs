import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';

import { PublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface TokenPair {
  access: string;
  refresh: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const password = await hash(dto.password, 10);

    // Роль из запроса не используем: самостоятельно зарегистрироваться
    // администратором нельзя.
    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      username: dto.username,
      password,
    });

    return this.usersService.toPublic(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmailWithPassword(
      dto.email.toLowerCase(),
    );

    if (user === null || !(await compare(dto.password, user.password))) {
      throw new UnauthorizedException('Неверный email или пароль.');
    }

    return {
      access: await this.signToken(user, 'access'),
      refresh: await this.signToken(user, 'refresh'),
    };
  }

  async refresh(refreshToken: string): Promise<{ access: string }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (user === null) {
      throw new UnauthorizedException('Пользователь не найден.');
    }

    return { access: await this.signToken(user, 'access') };
  }

  private async signToken(
    user: PublicUser,
    type: 'access' | 'refresh',
  ): Promise<string> {
    const isAccess = type === 'access';
    const secretName = isAccess ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET';
    const expiresName = isAccess
      ? 'JWT_ACCESS_EXPIRES_IN'
      : 'JWT_REFRESH_EXPIRES_IN';
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>(secretName),
      expiresIn: Number(this.configService.getOrThrow<string>(expiresName)),
    });
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Передан неверный тип токена.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh-токен недействителен.');
    }
  }
}
