import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { GetHistoryDto } from './dto/get-history.dto';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ValidRoles } from '../auth/enums/roles.enum';
import { User } from '../auth/entities/users.entity';
import { CheckOutDto } from './dto/check-out.dto';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendanceService: AttendancesService) {}

  /**
   * Endpoint para registrar el check-in de un usuario.
   */
  @Post('check-in')
  @Auth(ValidRoles.receptionist)
  checkIn(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @GetUser() receptionist: User,
  ) {
    console.log(
      `Check-in realizado por recepcionista: ${receptionist.email} para el usuario: ${createAttendanceDto.userId}`,
    );
    return this.attendanceService.checkIn(createAttendanceDto);
  }

  /**
   * Endpoint para que un recepcionista registre el check-out de un usuario.
   */
  @Post('check-out')
  @Auth(ValidRoles.receptionist)
  checkOutByReceptionist(@Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.checkOut(checkOutDto.userId);
  }

  /**
   * Obtiene el estado actual de un usuario.
   */
  @Get('status/:userId')
  @Auth(ValidRoles.admin)
  getStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.attendanceService.getUserAttendanceStatus(userId);
  }

  /**
   * Obtiene el historial de asistencias de un usuario.
   */
  @Get('history/:userId')
  @Auth(ValidRoles.admin)
  getHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() queryParams: GetHistoryDto,
  ) {
    return this.attendanceService.getUserAttendanceHistory(userId, queryParams);
  }

  /**
   * Obtiene las estadísticas de asistencia de un usuario.
   */
  @Get('stats/:userId')
  @Auth(ValidRoles.admin)
  getStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.attendanceService.getUserAttendanceStats(userId);
  }

  /**
   * Endpoint para que los administradores vean quién está actualmente en las instalaciones.
   */
  @Get('active')
  @Auth(ValidRoles.admin)
  getAllActive() {
    return this.attendanceService.getActiveAttendances();
  }
}
