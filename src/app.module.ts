import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './entity/users/users.module';
import { SessionModule } from './entity/session/session.module';
import { AuthModule } from './entity/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    DatabaseModule,
    UsersModule,
    SessionModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
