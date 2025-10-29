import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import type { User } from "./users.entity";
import { User as UserEntity } from "./users.entity"; 
import { ValidRoles } from "../enums/roles.enum";

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    name: ValidRoles;

    
    @ManyToMany(() => UserEntity, user => user.roles)
    users: User[];
}