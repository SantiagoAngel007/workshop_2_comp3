import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
