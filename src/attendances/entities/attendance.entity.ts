import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { User } from '../../auth/entities/users.entity';
import { User as UserEntity } from '../../auth/entities/users.entity';

export enum AttendanceType {
  GYM = 'gym',
  CLASS = 'class',
}

@Entity('attendances')
@Index(['user', 'dateKey', 'type']) // Índice para validaciones de negocio
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.attendances, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamptz', name: 'entrance_datetime' })
  entranceDatetime: Date;

  @Column({ type: 'timestamptz', name: 'exit_datetime', nullable: true })
  exitDatetime: Date;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    default: AttendanceType.GYM,
  })
  type: AttendanceType;

  @Index() // Un índice simple para búsquedas rápidas por esta columna
  @Column({ type: 'varchar', length: 50, name: 'date_key' })
  dateKey: string;

  @Index() // Un índice para filtrar por registros activos
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
