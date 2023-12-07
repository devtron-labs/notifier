import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity("smtp_config")
export class SMTPConfig {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    port: string;

    @Column()
    host: string;

    @Column()
    auth_type: string;

    @Column()
    auth_user: string;

    @Column()
    auth_password: string;

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