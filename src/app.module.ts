import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AttendancesModule } from './attendances/attendances.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService  } from '@nestjs/config';
import { User } from './auth/entities/users.entity';
import { Role } from './auth/entities/roles.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +!process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true
    }),

    // 🔹 Tus módulos de negocio
    UsersModule,
    MembershipsModule,
    AuthModule,
    SubscriptionsModule,
    AttendancesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
