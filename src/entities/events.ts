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