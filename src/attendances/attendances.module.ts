import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { User } from 'src/auth/entities/users.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User, Subscription]),
    AuthModule,
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
})
export class AttendancesModule {}
