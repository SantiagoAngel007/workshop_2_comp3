import {
  Column,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  DeleteDateColumn
} from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date')
  start_date: Date;

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

  @DeleteDateColumn()
  deletedAt?: Date;
}
