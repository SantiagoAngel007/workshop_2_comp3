
@Entity()
export class permissions{

    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column({
        type: 'text',
        unique: true
    })
    name:string;

}