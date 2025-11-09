import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { RegisterClassAttendanceDto } from './dto/register-class-attendance.dto';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ValidRoles } from '../auth/enums/roles.enum';
import { User } from '../auth/entities/users.entity';
import { CheckOutDto } from './dto/check-out.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('attendances')
@ApiBearerAuth()
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendanceService: AttendancesService) {}

  /**
   * GET /attendances - Obtiene todas las asistencias del sistema
   */
  @Get()
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Get all attendances (Admin only)' })
  @ApiResponse({ status: 200, description: 'A list of all attendances.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async findAll() {
    return await this.attendanceService.findAll();
  }

  /**
   * Endpoint para registrar el check-in de un usuario.
   */
  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  @Auth(ValidRoles.receptionist)
  @ApiOperation({ summary: 'Register a user check-in (Receptionist only)' })
  @ApiResponse({ status: 201, description: 'Check-in successful.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. User may already be checked in or has no active subscription.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  checkIn(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @GetUser() receptionist: User,
  ) {
    console.log(
      `Check-in realizado por recepcionista: ${receptionist.email} para el usuario: ${createAttendanceDto.userId}`,
    );
    return this.attendanceService.checkIn(createAttendanceDto, receptionist.id);
  }

  /**
   * Endpoint para que un recepcionista registre el check-out de un usuario.
   */
  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.receptionist)
  @ApiOperation({ summary: 'Register a user check-out (Receptionist only)' })
  @ApiResponse({ status: 200, description: 'Check-out successful.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. User is not currently checked in.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  checkOutByReceptionist(@Body() checkOutDto: CheckOutDto) {
    return this.attendanceService.checkOut(checkOutDto.userId);
  }

  /**
   * Obtiene el estado actual de un usuario.
   */
  @Get('status/:userId')
  @Auth(ValidRoles.admin, ValidRoles.client, ValidRoles.receptionist, ValidRoles.coach)
  @ApiOperation({
    summary: "Get a user's current attendance status (Admin only)",
  })
  @ApiParam({ name: 'userId', description: 'The UUID of the user' })
  @ApiResponse({ status: 200, description: "User's current status." })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.attendanceService.getUserAttendanceStatus(userId);
  }

  /**
   * Obtiene el historial de asistencias de un usuario.
   */
  @Get('history/:userId')
  @Auth(ValidRoles.admin, ValidRoles.client, ValidRoles.receptionist,  ValidRoles.coach)
  @ApiOperation({ summary: "Get a user's attendance history (Admin only)" })
  @ApiParam({ name: 'userId', description: 'The UUID of the user' })
  @ApiResponse({ status: 200, description: 'A list of attendance records.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
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
  @Auth(ValidRoles.admin, ValidRoles.client, ValidRoles.receptionist,  ValidRoles.coach)
  @ApiOperation({ summary: "Get a user's attendance statistics (Admin only)" })
  @ApiParam({ name: 'userId', description: 'The UUID of the user' })
  @ApiResponse({
    status: 200,
    description: 'Attendance statistics for the user.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.attendanceService.getUserAttendanceStats(userId);
  }

  /**
   * Endpoint para que los administradores vean quién está actualmente en las instalaciones.
   */
  @Get('active')
  @Auth(ValidRoles.admin, ValidRoles.receptionist,  ValidRoles.coach)
  @ApiOperation({ summary: 'Get all users currently checked-in (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'A list of active attendance records.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getAllActive() {
    return this.attendanceService.getActiveAttendances();
  }

  /**
   * Endpoint para que un coach registre la asistencia a una clase.
   */
  @Post('class/register')
  @HttpCode(HttpStatus.CREATED)
  @Auth(ValidRoles.coach,  ValidRoles.admin)
  @ApiOperation({ summary: 'Register class attendance (Coach only)' })
  @ApiResponse({ status: 201, description: 'Class attendance registered.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. User not found or has no active subscription.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  registerClassAttendance(
    @Body() registerClassDto: RegisterClassAttendanceDto,
    @GetUser() coach: User,
  ) {
    return this.attendanceService.registerClassAttendance(
      registerClassDto,
      coach,
    );
  }

  /**
   * Endpoint para que un coach vea las clases que ha registrado.
   */
  @Get('class/my-classes')
  @Auth(ValidRoles.coach)
  @ApiOperation({ summary: "Get coach's registered classes" })
  @ApiResponse({
    status: 200,
    description: 'A list of classes registered by this coach.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getMyClasses(@GetUser() coach: User) {
    return this.attendanceService.getCoachClasses(coach.id);
  }

  /**
   * Endpoint para ver todas las clases registradas hoy.
   */
  @Get('class/today')
  @Auth(ValidRoles.coach, ValidRoles.admin)
  @ApiOperation({ summary: 'Get all classes registered today' })
  @ApiResponse({
    status: 200,
    description: 'A list of all classes registered today.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getTodayClasses() {
    return this.attendanceService.getTodayClasses();
  }
}
