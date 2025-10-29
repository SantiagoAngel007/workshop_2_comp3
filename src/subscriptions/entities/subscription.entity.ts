import {
  Column,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column('bool', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('User', 'subscriptions', { onDelete: 'CASCADE' })
  user: any;

  @ManyToMany('Membership', { eager: false })
  @JoinTable({
    name: 'subscription_memberships',
    joinColumn: { name: 'subscriptionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'membershipId', referencedColumnName: 'id' },
  })
  memberships: any[];
}
