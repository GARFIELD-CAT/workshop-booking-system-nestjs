import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const config = new ConfigService({
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_ACCESS_EXPIRES_IN: '3600',
    JWT_REFRESH_EXPIRES_IN: '86400',
  });
  const jwtService = new JwtService();
  let storedUser: {
    id: number;
    email: string;
    username: string;
    password: string;
    role: UserRole;
  };
  let authService: AuthService;

  beforeEach(() => {
    const usersService = {
      create: async (data: Omit<typeof storedUser, 'id' | 'role'>) => {
        storedUser = { id: 1, role: UserRole.User, ...data };

        return storedUser;
      },
      findByEmailWithPassword: async (email: string) =>
        storedUser?.email === email ? storedUser : null,
      findById: async (id: number) =>
        storedUser?.id === id ? storedUser : null,
      toPublic: (user: typeof storedUser) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      }),
    } as unknown as UsersService;

    authService = new AuthService(usersService, jwtService, config);
  });

  it('registers a regular user and hides the password', async () => {
    const result = await authService.register({
      email: 'student@example.com',
      username: 'student',
      password: 'studentPass',
    });

    expect(result).toEqual({
      id: 1,
      email: 'student@example.com',
      username: 'student',
      role: UserRole.User,
    });
    expect(storedUser.password).not.toBe('studentPass');
    expect(await compare('studentPass', storedUser.password)).toBe(true);
  });

  it('returns access and refresh tokens for valid credentials', async () => {
    await authService.register({
      email: 'student@example.com',
      username: 'student',
      password: 'studentPass',
    });

    const tokens = await authService.login({
      email: 'student@example.com',
      password: 'studentPass',
    });
    const accessPayload = await jwtService.verifyAsync(tokens.access, {
      secret: 'access-secret',
    });
    const refreshPayload = await jwtService.verifyAsync(tokens.refresh, {
      secret: 'refresh-secret',
    });

    expect(accessPayload.type).toBe('access');
    expect(refreshPayload.type).toBe('refresh');
    expect(accessPayload.sub).toBe(1);
  });

  it('refreshes an access token', async () => {
    await authService.register({
      email: 'student@example.com',
      username: 'student',
      password: 'studentPass',
    });
    const tokens = await authService.login({
      email: 'student@example.com',
      password: 'studentPass',
    });

    const refreshed = await authService.refresh(tokens.refresh);
    const payload = await jwtService.verifyAsync(refreshed.access, {
      secret: 'access-secret',
    });

    expect(payload.type).toBe('access');
    expect(payload.sub).toBe(1);
  });

  it('rejects an invalid password', async () => {
    await authService.register({
      email: 'student@example.com',
      username: 'student',
      password: 'studentPass',
    });

    await expect(
      authService.login({
        email: 'student@example.com',
        password: 'wrongPassword',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
