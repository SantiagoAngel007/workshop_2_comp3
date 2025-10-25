import { Subscription } from '../../subscriptions/entities/subscription.entity';
import {
  Column,
  ManyToMany,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column('boolean', { default: true })
  status: boolean;

  @Column('int')
  max_classes_assistance: number;

  @Column('int')
  max_gym_assistance: number;

  @Column('int')
  duration_months: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => Subscription, (subscription) => subscription.memberships, { eager: false })
  subscriptions: Subscription[];
}
