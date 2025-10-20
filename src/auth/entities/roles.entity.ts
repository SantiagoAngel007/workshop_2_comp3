
@Entity()
export class roles{

    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({
        type: 'text',
        unique: true
    })
    name:string;

}