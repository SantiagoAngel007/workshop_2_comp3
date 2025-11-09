import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  /**
   * Crea una nueva clase
   */
  async create(createClassDto: CreateClassDto): Promise<Class> {
    // Verificar si ya existe una clase con ese nombre
    const existingClass = await this.classRepository.findOne({
      where: { name: createClassDto.name },
    });

    if (existingClass) {
      throw new ConflictException(
        `Ya existe una clase con el nombre '${createClassDto.name}'`,
      );
    }

    const newClass = this.classRepository.create(createClassDto);
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
      relations: ['attendances'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID '${id}' no encontrada`);
    }

    return classEntity;
  }

  /**
   * Actualiza una clase
   */
  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findOne(id);

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
   * Elimina una clase (solo si no tiene asistencias registradas)
   */
  async remove(id: string): Promise<void> {
    const classEntity = await this.findOne(id);

    // Verificar si tiene asistencias registradas
    const attendanceCount = await this.classRepository
      .createQueryBuilder('class')
      .leftJoin('class.attendances', 'attendance')
      .where('class.id = :id', { id })
      .getCount();

    if (attendanceCount > 0) {
      throw new ConflictException(
        'No se puede eliminar esta clase porque ya tiene registros de asistencia',
      );
    }

    await this.classRepository.softRemove(classEntity);
  }

  /**
   * Activa o desactiva una clase
   */
  async toggleActive(id: string): Promise<Class> {
    const classEntity = await this.findOne(id);
    classEntity.isActive = !classEntity.isActive;
    return await this.classRepository.save(classEntity);
  }
}
