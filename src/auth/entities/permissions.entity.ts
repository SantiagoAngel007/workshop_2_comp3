
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    name: string;
}