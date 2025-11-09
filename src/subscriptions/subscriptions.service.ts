import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../auth/entities/users.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AddMembershipDto } from './dto/add-membership.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Encuentra la subscripción de un usuario por su ID
   */
  async findSubscriptionByUserId(userId: string): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user', 'memberships'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for this user');
    }

    return subscription;
  }

  /**
   * Verifica si un usuario tiene una subscripción activa
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        isActive: true,
      },
    });

    return !!activeSubscription;
  }

  /**
   * Crea una subscripción para un usuario
   */
  async createSubscriptionForUser(userId: string): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verificar si el usuario ya tiene una subscripción activa
    const hasActive = await this.hasActiveSubscription(userId);

    if (hasActive) {
      throw new ConflictException(
        'El usuario ya tiene una subscripción activa. Debe esperar a que caduque antes de adquirir una nueva.',
      );
    }

    // Crear nueva subscripción vacía (sin membresías inicialmente)
    const newSubscription = this.subscriptionRepository.create({
      start_date: new Date(),
      isActive: true,
      user,
      memberships: [],
    });

    return await this.subscriptionRepository.save(newSubscription);
  }

  /**
   * Agrega una membresía a una subscripción existente
   */
  async addMembershipToSubscription(
    subscriptionId: string,
    addMembershipDto: AddMembershipDto,
  ): Promise<Subscription> {
    const { membershipId } = addMembershipDto;

    // Buscar la membresía
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Buscar la subscripción
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['memberships'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verificar si la membresía ya está agregada
    const alreadyAdded = subscription.memberships.some(
      (m) => m.id === membershipId,
    );

    if (alreadyAdded) {
      throw new ConflictException(
        'Esta membresía ya está agregada a la subscripción',
      );
    }

    // Agregar la membresía a la subscripción
    subscription.memberships.push(membership);

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Obtiene todas las subscripciones
   */
  async findAll(): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      relations: ['user', 'memberships'],
    });
  }

  /**
   * Obtiene una subscripción por ID
   */
  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'memberships'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  /**
   * Actualiza una subscripción
   */
  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);

    // Si se están actualizando las membresías, hay que cargarlas
    if (updateSubscriptionDto.membershipIds) {
      const memberships = await this.membershipRepository.findByIds(
        updateSubscriptionDto.membershipIds,
      );

      if (memberships.length !== updateSubscriptionDto.membershipIds.length) {
        throw new NotFoundException('One or more memberships not found');
      }

      subscription.memberships = memberships;
    }

    // Actualizar los demás campos
    Object.assign(subscription, updateSubscriptionDto);

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Desactiva una subscripción (cuando expira o se cancela)
   */
  async deactivateSubscription(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);

    subscription.isActive = false;

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Activa una subscripción
   */
  async activateSubscription(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);

    // Verificar si el usuario ya tiene otra subscripción activa
    const hasActive = await this.hasActiveSubscription(subscription.user.id);

    if (hasActive) {
      throw new ConflictException(
        'El usuario ya tiene una subscripción activa.',
      );
    }

    subscription.isActive = true;

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Elimina una subscripción (soft delete)
   */
  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.subscriptionRepository.softRemove(subscription);
  }
}
