import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity("ses_config")
export class SesConfig {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    region: string;

    @Column()
    access_key: string;

    @Column()
    secret_access_key: string;

    @Column()
    session_token: string;

    @Column()
    from_email: string;

    @Column()
    config_name: string;

    @Column()
    description: string;

    @Column()
    default: boolean;

    @Column()
    deleted: boolean;
}