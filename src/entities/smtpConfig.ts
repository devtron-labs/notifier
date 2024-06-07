/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    default: string;

    @Column()
    deleted: boolean;
}