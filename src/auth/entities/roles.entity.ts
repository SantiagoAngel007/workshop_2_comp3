import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { User } from "./users.entity";         
import { Permission } from "./permissions.entity";
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

    
    @ManyToMany(() => Permission, { eager: false })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
    })
    permissions: Permission[];
}