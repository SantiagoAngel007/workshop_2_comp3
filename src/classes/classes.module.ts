import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './entities/class.entity';
import { Attendance } from '../attendances/entities/attendance.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService],
  imports: [TypeOrmModule.forFeature([Class, Attendance]), AuthModule],
  exports: [ClassesService, TypeOrmModule],
})
export class ClassesModule {}
