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