 import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";
 
@Entity("notification_templates")
export class NotificationTemplates {
 
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    channel_type: string;

    @Column()
    node_type: string;

    @Column()
    event_type_id: number;

    @Column()
    template_name: string;
    
    @Column()
    template_payload: string

}