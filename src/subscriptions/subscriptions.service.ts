import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { User } from '../auth/entities/users.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async create(_createSubscriptionDto: CreateSubscriptionDto, user: User) {
    const { membershipIds, ...subscriptionData } = _createSubscriptionDto;

    // Validar que existan los memberships
    const memberships = await this.membershipRepository.findByIds(membershipIds);
    
    if (memberships.length !== membershipIds.length) {
      throw new BadRequestException('One or more memberships not found');
    }

    // Crear la subscription
    const subscription = this.subscriptionRepository.create({
      ...subscriptionData,
      user,
      memberships,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async findByUser(userId: string) {
    return await this.subscriptionRepository.find({
      where: { user: { id: userId } },
      relations: ['memberships'],
    });
  }

  findAll() {
    return `This action returns all subscriptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  update(id: number, _updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
