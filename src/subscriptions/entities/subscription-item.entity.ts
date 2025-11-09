import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { Membership } from '../../memberships/entities/membership.entity';

export enum SubscriptionItemStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('subscription_items')
export class SubscriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con Subscription
  @ManyToOne('Subscription', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  // Relación con Membership (plantilla de referencia)
  @ManyToOne(() => Membership, { eager: true })
  @JoinColumn({ name: 'membershipId' })
  membership: Membership;

  // Valores "congelados" al momento de la compra (copiados de Membership)
  @Column('text')
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  cost: number;

  @Column('int')
  max_classes_assistance: number;

  @Column('int')
  max_gym_assistance: number;

  @Column('int')
  duration_months: number;

  // Fechas y estado
  @Column('date')
  purchase_date: Date;

  @Column('date')
  start_date: Date;

  @Column('date')
  end_date: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionItemStatus,
    default: SubscriptionItemStatus.PENDING,
  })
  status: SubscriptionItemStatus;

  // Auditoría
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
