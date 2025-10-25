import { Subscription } from '../../subscriptions/entities/subscription.entity';
import {
  Column,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Membership {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text", {unique: true})
    name: string;

    @Column("number")
    cost: number;

    @Column('boolean')
    status?: boolean;

    @Column('int')
    max_classes_assistance: number;

    @Column('int')
    max_gym_assistance: number;

    @Column('int')
    duration_months: number; 

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToMany(() => Subscription, { eager: false })
    @JoinTable({
        name: "memberships_subscription",
        joinColumn: { name: "membershipId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "subscriptionId", referencedColumnName: "id" },
    })
    Subscription: Subscription[];


}
