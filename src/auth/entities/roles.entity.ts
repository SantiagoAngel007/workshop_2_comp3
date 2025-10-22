import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { User } from "./users.entity";         
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

    
    @ManyToMany(() => User, user => user.roles)
    users: User[];
}