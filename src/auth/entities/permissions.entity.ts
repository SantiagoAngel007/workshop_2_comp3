
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Role } from "./roles.entity";

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    name: string;

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];
}