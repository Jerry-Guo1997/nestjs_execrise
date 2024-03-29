import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";

@ValidatorConstraint({ name: 'isMatch' })
export class MatchConstraint implements ValidatorConstraintInterface{
    validate(value: any, args?: ValidationArguments): boolean | Promise<boolean> {
        const [relatedProperty] = args.constraints;
        const relatedValue = (args.object as any)[relatedProperty];
        return value === relatedValue;
    }

    defaultMessage(args?: ValidationArguments): string {
        const [relatedProperty] = args.constraints;
        return `${relatedProperty} and ${args.property} don't match`;
    }
}

export function IsMatch(relatedProperty: string, validationOptions?: ValidationOptions){
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [relatedProperty],
            validator: MatchConstraint,
        });
    };
}