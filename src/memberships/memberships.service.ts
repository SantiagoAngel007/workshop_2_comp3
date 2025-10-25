import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  /**
   * Obtiene todas las membresías
   */
  async findAll(): Promise<Membership[]> {
    return await this.membershipRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Busca una membresía por ID
   */
  async findMembershipById(membershipId: string): Promise<Membership> {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membresía no encontrada');
    }

    return membership;
  }

  /**
   * Crea una nueva membresía
   */
  async createNewMembership(
    createMembershipDto: CreateMembershipDto,
  ): Promise<Membership> {
    // Validar que el nombre no exista
    await this.validateNameIsUnique(createMembershipDto.name);

    // Crear la membresía (TypeORM genera el UUID automáticamente)
    const newMembership = this.membershipRepository.create({
      ...createMembershipDto,
      status: createMembershipDto.status ?? true,
    });

    return await this.membershipRepository.save(newMembership);
  }

  /**
   * Actualiza una membresía existente
   */
  async updateExistingMembership(
    membershipId: string,
    updateMembershipDto: UpdateMembershipDto,
  ): Promise<Membership> {
    // Verificar que la membresía existe
    const existingMembership = await this.findMembershipById(membershipId);

    // Si se actualiza el nombre, validar que no exista otro con ese nombre
    if (
      updateMembershipDto.name &&
      updateMembershipDto.name !== existingMembership.name
    ) {
      await this.validateNameIsUnique(updateMembershipDto.name);
    }

    // Aplicar actualizaciones
    Object.assign(existingMembership, updateMembershipDto);

    return await this.membershipRepository.save(existingMembership);
  }

  /**
   * Elimina una membresía
   */
  async removeMembership(membershipId: string): Promise<void> {
    const membershipToDelete = await this.findMembershipById(membershipId);
    await this.membershipRepository.remove(membershipToDelete);
  }

  /**
   * Cambia el estado activo/inactivo de una membresía
   */
  async toggleMembershipStatus(membershipId: string): Promise<Membership> {
    const membership = await this.findMembershipById(membershipId);

    membership.status = !membership.status;

    return await this.membershipRepository.save(membership);
  }

  /**
   * Valida que el nombre de la membresía sea único
   * @private
   */
  private async validateNameIsUnique(name: string): Promise<void> {
    const existingMembership = await this.membershipRepository.findOne({
      where: { name },
    });

    if (existingMembership) {
      throw new ConflictException('El nombre de la membresía ya está en uso');
    }
  }
}
