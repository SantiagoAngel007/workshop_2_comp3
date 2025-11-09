import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { AuthModule } from '../auth/auth.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { Membership } from '../memberships/entities/membership.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionItem } from '../subscriptions/entities/subscription-item.entity';
import { Attendance } from '../attendances/entities/attendance.entity';
import { Class } from '../classes/entities/class.entity';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    AuthModule,
    MembershipsModule,
    TypeOrmModule.forFeature([Membership, Subscription, SubscriptionItem, Attendance, Class]),
  ],
})
export class SeedModule {}
