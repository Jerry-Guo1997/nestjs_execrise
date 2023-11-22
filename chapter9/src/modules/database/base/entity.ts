import { Expose } from "class-transformer";
import { PrimaryGeneratedColumn, BaseEntity as TypeormBaseEntity } from "typeorm";

export class BaseEntity extends TypeormBaseEntity{
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;
}