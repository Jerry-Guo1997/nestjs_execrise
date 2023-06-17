import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import { getDataSourceToken, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, ObjectType } from 'typeorm';

@Module({})
export class DatabaseModule {
    static forRoot(configRegister:()=>TypeOrmModuleOptions):DynamicModule{
        return{
            global:true,
            module:DatabaseModule,
            imports:[TypeOrmModule.forRoot(configRegister())],
        };
    }
}