import { Injectable } from "@nestjs/common";
import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";
import { merge } from "lodash";

import { DataSource, ObjectType } from "typeorm";

type Condition = {
    entity: ObjectType<any>;
    ignore?: string;
    findKey?: string;
    property?: string;
}

@Injectable()
@ValidatorConstraint({name: 'treeDataUniqueExist', async: true})
export class UniqueTreeExistConstraint implements ValidatorConstraintInterface{
    constructor(private dataSource: DataSource){}

    async validate(value: any, args?: ValidationArguments){
        const config: Omit<Condition, 'entity'> = {
            ignore: 'id',
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            :{
                ...config,
                entity: args.constraints[0],
            }) as unknown as Required<Condition>;
        if(!condition.findKey){
            condition.findKey = condition.ignore;
        }
        if(!condition.entity) return false;

        const ignoreValue = (args.object as any)[condition.ignore];

        const keyValue = (args.object as any)[condition.findKey];
        if(!ignoreValue || !keyValue) return false;
        const repo = this.dataSource.getTreeRepository(condition.entity);

        const item = await repo.findOne({
            where: {[condition.findKey]: keyValue},
            relations: ['parent'],
        });

        if(!item) return false;

        const rows: any[] = await repo.find({
            where: {
                parent: !item.parent ? null : {id: item.parent.id},
            },
            withDeleted: true,
        });
        return !rows.find(
            (row) => row[condition.property] === value && row[condition.ignore] !== ignoreValue,
        );
    }

    defaultMessage(args?: ValidationArguments): string {
        const {entity, property} = args.constraints[0];
        const queryProperty = property ?? args.property;
        if(!entity){
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique with siblings element!`;
    }
}

export function IsTreeUniqueExist(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
){
    return(object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueTreeExistConstraint,
        });
    };
}