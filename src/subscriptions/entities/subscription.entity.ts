import type { User } from 'src/auth/entities/users.entity';
import { User as UserEntity } from 'src/auth/entities/users.entity';
import type { Membership } from 'src/memberships/entities/membership.entity';
import { Membership as MembershipEntity } from 'src/memberships/entities/membership.entity';

import {
  Column,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column('int')
  max_classes_assistance: number;

  @Column('int')
  max_gym_assistance: number;

  @Column('int')
  duration_months: number;

  @Column('date')
  purchase_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => UserEntity, (user) => user.subscriptions, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToMany(
    () => MembershipEntity,
    (membership) => membership.subscriptions,
    {
      eager: false,
    },
  )
  @JoinTable({
    name: 'subscription_memberships',
    joinColumn: { name: 'subscriptionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'membershipId', referencedColumnName: 'id' },
  })
  memberships: Membership[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
