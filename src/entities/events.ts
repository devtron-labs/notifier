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
 
@Entity("event")
export class Event {
 
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    event_type: string;

    @Column()
    description: string;

}

export class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}
export class CustomResponse {
    message: string;
    status: number;
    error?: CustomError; // Custom error field, marked as optional

    constructor(message: string, status: number, error?: CustomError) {
        this.message = message;
        this.status = status;
        this.error = error;
    }
}