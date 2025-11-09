import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Attendance } from '../../attendances/entities/attendance.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100, unique: true })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('int', { nullable: true })
  duration_minutes?: number;

  @Column('int', { default: 20 })
  max_capacity: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @OneToMany('Attendance', 'class')
  attendances: Attendance[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
