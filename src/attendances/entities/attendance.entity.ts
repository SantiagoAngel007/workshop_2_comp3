import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

export enum AttendanceType {
  GYM = 'gym',
  CLASS = 'class',
}

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('User', 'attendances', { onDelete: 'CASCADE' })
  user: any;

  @Column({
    type: 'enum',
    enum: AttendanceType,
  })
  type: AttendanceType;

  @Column('timestamp')
  entranceDatetime: Date;

  @Column('timestamp', { nullable: true })
  exitDatetime?: Date;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('varchar', { length: 10 })
  dateKey: string;

  // Campos específicos para clases
  @ManyToOne('Class', 'attendances', { nullable: true, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'classId' })
  class?: any;

  @ManyToOne('User', { nullable: true, eager: true })
  @JoinColumn({ name: 'coachId' })
  coach?: any;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
