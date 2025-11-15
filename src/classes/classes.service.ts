import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { User } from '../auth/entities/users.entity';
import { Attendance } from '../attendances/entities/attendance.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  /**
   * Crea una nueva clase
   */
  async create(createClassDto: CreateClassDto, createdBy: User): Promise<Class> {
    // Verificar si ya existe una clase con ese nombre
    const existingClass = await this.classRepository.findOne({
      where: { name: createClassDto.name },
    });

    if (existingClass) {
      throw new ConflictException(
        `Ya existe una clase con el nombre '${createClassDto.name}'`,
      );
    }

    const newClass = this.classRepository.create({
      ...createClassDto,
      createdBy,
    });
    return await this.classRepository.save(newClass);
  }

  /**
   * Obtiene todas las clases (incluye las inactivas)
   */
  async findAll(): Promise<Class[]> {
    return await this.classRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Obtiene solo las clases activas
   */
  async findActive(): Promise<Class[]> {
    return await this.classRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Obtiene una clase por ID
   */
  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['attendances', 'createdBy'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID '${id}' no encontrada`);
    }

    return classEntity;
  }

  /**
   * Actualiza una clase
   */
  async update(
    id: string,
    updateClassDto: UpdateClassDto,
    user: User,
  ): Promise<Class> {
    const classEntity = await this.findOne(id);

    // Validar permisos: solo el creador o admin puede editar
    await this.validateUserCanModify(classEntity, user);

    // Si se está actualizando el nombre, verificar que no exista otra clase con ese nombre
    if (updateClassDto.name && updateClassDto.name !== classEntity.name) {
      const existingClass = await this.classRepository.findOne({
        where: { name: updateClassDto.name },
      });

      if (existingClass) {
        throw new ConflictException(
          `Ya existe una clase con el nombre '${updateClassDto.name}'`,
        );
      }
    }

    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  /**
   * Elimina una clase
   * Coach: solo puede eliminar si no tiene asistencias
   * Admin: puede eliminar siempre
   */
  async remove(id: string, user: User): Promise<void> {
    const classEntity = await this.findOne(id);

    // Validar permisos: solo el creador o admin puede eliminar
    await this.validateUserCanModify(classEntity, user);

    // Para coaches, verificar que no tenga asistencias
    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (!isAdmin) {
      const hasAttendances = await this.classHasAttendances(id);
      if (hasAttendances) {
        throw new BadRequestException(
          'No puedes eliminar esta clase porque tiene asistencias registradas',
        );
      }
    }

    await this.classRepository.softRemove(classEntity);
  }

  /**
   * Activa o desactiva una clase
   */
  async toggleActive(id: string, user: User): Promise<Class> {
    const classEntity = await this.findOne(id);

    // Validar permisos: solo el creador o admin puede desactivar
    await this.validateUserCanModify(classEntity, user);

    // Para coaches, verificar que no tenga asistencias al desactivar
    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (!isAdmin && classEntity.isActive) {
      // Está intentando desactivar
      const hasAttendances = await this.classHasAttendances(id);
      if (hasAttendances) {
        throw new BadRequestException(
          'No puedes desactivar esta clase porque tiene asistencias registradas',
        );
      }
    }

    classEntity.isActive = !classEntity.isActive;
    return await this.classRepository.save(classEntity);
  }

  // --- MÉTODOS AUXILIARES PRIVADOS ---

  /**
   * Verifica si una clase tiene asistencias registradas
   */
  private async classHasAttendances(classId: string): Promise<boolean> {
    const count = await this.attendanceRepository.count({
      where: { class: { id: classId } },
    });
    return count > 0;
  }

  /**
   * Valida si el usuario puede modificar una clase
   * Admin: puede modificar cualquier clase
   * Coach: solo puede modificar clases que él creó
   */
  private async validateUserCanModify(
    classEntity: Class,
    user: User,
  ): Promise<void> {
    const isAdmin = user.roles.some((role) => role.name === 'admin');

    // Admin puede modificar cualquier clase
    if (isAdmin) {
      return;
    }

    // Coach solo puede modificar sus propias clases
    if (classEntity.createdBy.id !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta clase. Solo puedes modificar clases que tú creaste.',
      );
    }
  }
}
