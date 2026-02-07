import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginUser, LoginUserResponse } from './types/login-user.types';
import { JwtPayload } from './types/jwt-payload.types';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private sessionsService: SessionService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    const { accessToken, refreshToken } = await this.loginUser({
      email: user.email,
      userId: user.id,
      userAgent: '',
      ipAddress: '',
      deviceInfo: '',
    });

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto, userAgent: string, ipAddress: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.loginUser({
      userId: user.id,
      userAgent,
      ipAddress,
      deviceInfo: this.getDeviceInfo(userAgent),
      email: user.email,
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    // Находим сессию по refresh token
    const session = await this.sessionsService.findOneByRefreshToken(
      refreshTokenDto.refreshToken,
    );

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Находим пользователя
    const user = await this.usersService.findOne(session.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Обновляем активность сессии
    await this.sessionsService.updateActivity(session.id);

    // Генерируем новый access token
    const accessToken = this.generateAccessToken(
      user.id,
      session.id,
      user.email,
    );

    return {
      accessToken,
      refreshToken: refreshTokenDto.refreshToken, // refresh token остается тот же
    };
  }

  async logout(refreshToken: string) {
    const session =
      await this.sessionsService.findOneByRefreshToken(refreshToken);

    await this.sessionsService.terminate(session.id, session.userId);

    return { message: 'Успешный выход' };
  }

  async loginUser(loginUser: LoginUser): Promise<LoginUserResponse> {
    const session = await this.sessionsService.create(loginUser);

    // Генерируем токены
    const accessToken = this.generateAccessToken(
      loginUser.userId,
      session.id,
      loginUser.email,
    );
    const refreshToken = session.refreshToken;

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private generateAccessToken(
    userId: string,
    sessionId: string,
    email: string,
  ): string {
    const payload: JwtPayload = {
      userId,
      sessionId,
      email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '3600s',
    });
  }

  // Получение информации об устройстве из User-Agent
  private getDeviceInfo(userAgent: string): string {
    if (!userAgent) return 'Unknown device';

    if (
      userAgent.includes('Mobile') ||
      userAgent.includes('Android') ||
      userAgent.includes('iPhone')
    ) {
      return 'Mobile';
    }

    if (userAgent.includes('Chrome')) {
      return 'Chrome';
    }

    if (userAgent.includes('Firefox')) {
      return 'Firefox';
    }

    if (userAgent.includes('Safari')) {
      return 'Safari';
    }

    return 'Web browser';
  }
}
