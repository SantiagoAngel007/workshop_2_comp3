import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { Role } from "./roles.entity"; 
import { Subscription } from "src/subscriptions/entities/subscription.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        unique: true
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

    @OneToMany(() => Subscription, subscription => subscription.user, { eager: false })
    subscriptions: Subscription[];
    
    @ManyToMany(() => Role, { eager: false })
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'userId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
    })
    roles: Role[];

    @BeforeInsert()
    @BeforeUpdate()
    checkFieldsBeforeChanges() {
        this.email = this.email.toLowerCase().trim();
    }
}