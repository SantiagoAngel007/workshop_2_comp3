import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AttendancesModule } from './attendances/attendances.module';

@Module({
  imports: [UsersModule, MembershipsModule, AuthModule, SubscriptionsModule, AttendancesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
