import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionItem, SubscriptionItemStatus } from './entities/subscription-item.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../auth/entities/users.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AddMembershipDto } from './dto/add-membership.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionItem)
    private readonly subscriptionItemRepository: Repository<SubscriptionItem>,
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
      relations: ['user', 'items', 'items.membership'],
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

    // Crear nueva subscripción vacía (sin items inicialmente)
    const newSubscription = this.subscriptionRepository.create({
      start_date: new Date(),
      isActive: true,
      user,
    });

    return await this.subscriptionRepository.save(newSubscription);
  }

  /**
   * Agrega una membresía a una subscripción existente
   * Crea un SubscriptionItem que congela los valores de la membresía
   */
  async addMembershipToSubscription(
    subscriptionId: string,
    addMembershipDto: AddMembershipDto,
  ): Promise<SubscriptionItem> {
    const { membershipId } = addMembershipDto;

    // Buscar la membresía plantilla
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Buscar la subscripción
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['items'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Buscar si ya tiene un item activo
    const activeItem = await this.subscriptionItemRepository.findOne({
      where: {
        subscription: { id: subscriptionId },
        status: SubscriptionItemStatus.ACTIVE,
      },
      order: { end_date: 'DESC' },
    });

    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let status: SubscriptionItemStatus;

    if (!activeItem) {
      // CASO 1: No tiene item activo - Activar inmediatamente
      startDate = today;
      endDate = this.addMonths(today, membership.duration_months);
      status = SubscriptionItemStatus.ACTIVE;
    } else {
      // CASO 2: Ya tiene uno activo - Programar para después
      startDate = activeItem.end_date;
      endDate = this.addMonths(activeItem.end_date, membership.duration_months);
      status = SubscriptionItemStatus.PENDING;
    }

    // Crear el SubscriptionItem con valores "congelados"
    const subscriptionItem = this.subscriptionItemRepository.create({
      subscription,
      membership,
      // Copiar valores de la plantilla (congelar)
      name: membership.name,
      cost: membership.cost,
      max_classes_assistance: membership.max_classes_assistance,
      max_gym_assistance: membership.max_gym_assistance,
      duration_months: membership.duration_months,
      // Fechas
      purchase_date: today,
      start_date: startDate,
      end_date: endDate,
      status,
    });

    return await this.subscriptionItemRepository.save(subscriptionItem);
  }

  /**
   * Suma meses a una fecha
   */
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Obtiene todas las subscripciones
   */
  async findAll(): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      relations: ['user', 'items', 'items.membership'],
    });
  }

  /**
   * Obtiene una subscripción por ID
   */
  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.membership'],
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

    // Actualizar campos
    Object.assign(subscription, updateSubscriptionDto);

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Cron job que se ejecuta diariamente para expirar membresías y activar las pendientes
   * Se ejecuta todos los días a las 00:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMembershipExpiration() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche

    console.log(`[CRON] Checking for expired memberships at ${today.toISOString()}`);

    // Buscar items activos que ya expiraron
    const expiredItems = await this.subscriptionItemRepository.find({
      where: {
        status: SubscriptionItemStatus.ACTIVE,
        end_date: LessThan(today),
      },
      relations: ['subscription'],
    });

    console.log(`[CRON] Found ${expiredItems.length} expired memberships`);

    for (const item of expiredItems) {
      // Marcar como expirada
      item.status = SubscriptionItemStatus.EXPIRED;
      await this.subscriptionItemRepository.save(item);
      console.log(`[CRON] Expired membership: ${item.id} (${item.name})`);

      // Buscar la siguiente pendiente del mismo usuario
      const nextPending = await this.subscriptionItemRepository.findOne({
        where: {
          subscription: { id: item.subscription.id },
          status: SubscriptionItemStatus.PENDING,
        },
        order: { start_date: 'ASC' },
      });

      if (nextPending) {
        // Activar la siguiente
        nextPending.status = SubscriptionItemStatus.ACTIVE;
        await this.subscriptionItemRepository.save(nextPending);
        console.log(`[CRON] Activated pending membership: ${nextPending.id} (${nextPending.name})`);
      }
    }

    console.log(`[CRON] Membership expiration check completed`);
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