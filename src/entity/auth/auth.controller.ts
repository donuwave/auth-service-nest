import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RefreshTokenDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

@ApiTags('Auth')
@Controller('auth')
@ApiBearerAuth('jwt')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Зарегистрировать нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
  })
  @ApiResponse({ status: 400, description: 'Невалидные данные' })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Войти в систему' })
  @ApiResponse({ status: 200, description: 'Успешная аутентификация' })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  @ApiResponse({ status: 400, description: 'Невалидные данные' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Обновить токены' })
  @ApiResponse({ status: 200, description: 'Токены успешно обновлены' })
  @ApiResponse({
    status: 401,
    description: 'Невалидный или просроченный refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Выйти из системы' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  @ApiResponse({ status: 400, description: 'Невалидный refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        },
      },
    },
  })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
