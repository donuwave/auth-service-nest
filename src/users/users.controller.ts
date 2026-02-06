import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation } from '@nestjs/swagger';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users' })
  @Get()
  async getUsers(): Promise<User[]> {
    return await this.usersService.getUsers();
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createdUser: CreateUserDto): Promise<User> {
    return this.usersService.create(createdUser);
  }
}
