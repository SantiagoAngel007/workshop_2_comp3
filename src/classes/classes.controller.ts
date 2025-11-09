import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  /**
   * Crea una nueva clase (Coach y Admin)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(ValidRoles.coach, ValidRoles.admin)
  @ApiOperation({ summary: 'Create a new class (Coach & Admin only)' })
  @ApiResponse({ status: 201, description: 'Class created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. A class with this name already exists.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  /**
   * Obtiene todas las clases (Coach y Admin)
   */
  @Get()
  @Auth(ValidRoles.coach, ValidRoles.admin, ValidRoles.receptionist)
  @ApiOperation({ summary: 'Get all classes (Coach, Receptionist & Admin)' })
  @ApiResponse({ status: 200, description: 'List of all classes.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.classesService.findAll();
  }

  /**
   * Obtiene solo las clases activas (Coach, Admin, Receptionist)
   */
  @Get('active')
  @Auth(ValidRoles.coach, ValidRoles.admin, ValidRoles.receptionist)
  @ApiOperation({
    summary: 'Get only active classes (Coach, Receptionist & Admin)',
  })
  @ApiResponse({ status: 200, description: 'List of active classes.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findActive() {
    return this.classesService.findActive();
  }

  /**
   * Obtiene una clase por ID (Coach y Admin)
   */
  @Get(':id')
  @Auth(ValidRoles.coach, ValidRoles.admin, ValidRoles.receptionist)
  @ApiOperation({ summary: 'Get a class by ID (Coach, Receptionist & Admin)' })
  @ApiParam({ name: 'id', description: 'The UUID of the class' })
  @ApiResponse({ status: 200, description: 'Class found.' })
  @ApiResponse({ status: 404, description: 'Class not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOne(id);
  }

  /**
   * Actualiza una clase (Coach y Admin)
   */
  @Patch(':id')
  @Auth(ValidRoles.coach, ValidRoles.admin)
  @ApiOperation({ summary: 'Update a class (Coach & Admin only)' })
  @ApiParam({ name: 'id', description: 'The UUID of the class to update' })
  @ApiResponse({ status: 200, description: 'Class updated successfully.' })
  @ApiResponse({ status: 404, description: 'Class not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict. A class with this name already exists.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.update(id, updateClassDto);
  }

  /**
   * Activa o desactiva una clase (Admin solo)
   */
  @Patch(':id/toggle-active')
  @Auth(ValidRoles.admin)
  @ApiOperation({
    summary: 'Toggle class active status (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'The UUID of the class' })
  @ApiResponse({
    status: 200,
    description: 'Class active status toggled successfully.',
  })
  @ApiResponse({ status: 404, description: 'Class not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.toggleActive(id);
  }

  /**
   * Elimina una clase (Admin solo, solo si no tiene asistencias)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(ValidRoles.admin)
  @ApiOperation({
    summary:
      'Delete a class (Admin only, only if no attendance records exist)',
  })
  @ApiParam({ name: 'id', description: 'The UUID of the class to delete' })
  @ApiResponse({ status: 204, description: 'Class deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Class not found.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict. Cannot delete class with existing attendance records.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.remove(id);
  }
}
