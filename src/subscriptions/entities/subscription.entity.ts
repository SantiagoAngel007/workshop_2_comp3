import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn
} from 'typeorm';
import { SubscriptionItem } from './subscription-item.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date', { default: () => 'CURRENT_DATE' })
  start_date: Date;

  @Column('bool', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('User', 'subscriptions', { onDelete: 'CASCADE' })
  user: any;

  @OneToMany(() => SubscriptionItem, (item) => item.subscription, { eager: false })
  items: SubscriptionItem[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
