import { Injectable } from "@nestjs/common";
import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";
import { isNil, merge } from "lodash";
import { DataSource, ObjectType } from "typeorm";

type Condition = {
    entity: ObjectType<any>,
    property?: string,
}

@ValidatorConstraint({name: 'dataUnique' ,async: true})
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface{
    constructor(private dataSource: DataSource){}

    async validate(value: any, args?: ValidationArguments){
        const config: Omit<Condition, 'entity'> = {
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                ...config,
                entity: args.constraints[0],
            }) as unknown as Required<Condition>;

        if(!condition.entity) return false;
        try{
            const repo = this.dataSource.getRepository(condition.entity);
            return isNil(
                await repo.findOne({ where: { [condition.property]:value},withDeleted: true}),
            );
        }catch(err){
            return false;
        }
    }

    defaultMessage(args: ValidationArguments): string {
        const {entity,property} = args.constraints[0];
        const queryProperty = property ?? args.property;
        if(!(args.object as any).getManager){
            return 'getManager function not been found!';
        }
        if(!entity){
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique!`;
    }
}

export function IsUnique(
    params: ObjectType<any> | Condition,
    validationOptions: ValidationOptions,
){
    return (object: Record<string,any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueConstraint,
        });
    };
}