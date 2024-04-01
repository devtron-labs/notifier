import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity("webhook_config")
export class WebhookConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  web_hook_url: string;

  @Column()
  config_name: string;

  @Column({ type: 'jsonb', nullable: true })
  header: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  payload: string ;

  @Column()
  description: string;

  @Column()
  active: boolean;

  @Column()
  deleted: boolean;
}