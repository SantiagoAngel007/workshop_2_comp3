import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import type { Role } from './roles.entity';
import { Role as RoleEntity } from './roles.entity';
import type { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { Subscription as SubscriptionEntity } from 'src/subscriptions/entities/subscription.entity';
import type { Attendance } from 'src/attendances/entities/attendance.entity';
import { Attendance as AttendanceEntity } from 'src/attendances/entities/attendance.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    unique: true,
  })
  email: string;

  @Column('text')
  fullName: string;

  @Column('int')
  age: number;

  @Column('text')
  password?: string;

  @Column('bool', { default: true })
  isActive: boolean;

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.user, {
    eager: false,
  })
  subscriptions: Subscription[];

  @ManyToMany(() => RoleEntity, { eager: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.user, {
    eager: false,
  })
  attendances: Attendance[];

  @BeforeInsert()
  @BeforeUpdate()
  checkFieldsBeforeChanges() {
    this.email = this.email.toLowerCase().trim();
  }
}
