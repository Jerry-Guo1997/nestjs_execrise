import { Delete, Get, Patch, Post, SerializeOptions, Type } from "@nestjs/common";
import { BaseController } from "../base/controller";
import { BaseControllerWithTrash } from "../base/trashed.controller";
import { CurdItem, CurdOptions } from "../type";
import { CRUD_OPTIONS } from "../constants";
import { isNil } from "lodash";
import { ClassTransformOptions } from "class-transformer";


export const Crud = 
    (options: CurdOptions) =>
    <T extends BaseController<any> | BaseControllerWithTrash<any>>(Target: Type<T>) => {
        Reflect.defineMetadata(CRUD_OPTIONS, options, Target);

        const {id, enabled, dtos } = Reflect.getMetadata(CRUD_OPTIONS, Target) as CurdOptions;
        const methods: CurdItem[] = [];

        for(const value of enabled){
            const item = (typeof value === 'string' ? {name: value} : value) as CurdItem;
            if(
                methods.map(({name}) => name).includes(item.name) ||
                !isNil(Object.getOwnPropertyDescriptor(Target.prototype, item.name))
            )
            continue;
            methods.push(item);
        }

        for(const {name, option = {} } of methods){
            if(isNil(Object.getOwnPropertyDescriptor(Target.prototype,name))){
                const descriptor = 
                    Target instanceof BaseControllerWithTrash
                        ? Object.getOwnPropertyDescriptor(BaseControllerWithTrash.prototype,name)
                        : Object.getOwnPropertyDescriptor(BaseController.prototype, name);

                Object.defineProperty(Target.prototype, name , {
                    ...descriptor,
                    async value(...args: any[]){
                        return descriptor.value.apply(this.args);
                    },
                });
            }

            const descriptor  = Object.getOwnPropertyDescriptor(Target.prototype, name);
            
            const [, ...params] = Reflect.getMetadata('design:paramtypes', Target.prototype, name);

            if(name === 'store' && !isNil(dtos.store)) {
                Reflect.defineMetadata(
                    'design:paramtypes',
                    [dtos.store, ...params],
                    Target.prototype,
                    name,
                );
            }else if (name === 'update' && !isNil(dtos.update)){
                Reflect.defineMetadata(
                    'design:paramtypes',
                    [dtos.list, ...params],
                    Target.prototype,
                    name,
                );
            } else if (name === 'list' && !isNil(dtos.list)){
                Reflect.defineMetadata(
                    'design:paramtypes',
                    [dtos.list, ...params],
                    Target.prototype,
                    name,
                );
            }

            let serialize: ClassTransformOptions = {};
            if(isNil(option.serialize)){
                if(['detail','store','update','delete','restore'].includes(name)){
                    serialize = {groups: [`${id}-detail`]};
                } else if (['list'].includes(name)){
                    serialize = {groups: [`${id}-list`]};
                }
            }else if (option.serialize === 'noGroup'){
                serialize = {};
            }else {
                serialize = option.serialize;
            }
            SerializeOptions(serialize)(Target, name, descriptor);

            switch (name) {
                case 'list':
                    Get()(Target, name, descriptor);
                    break;
                case 'detail':
                    Get(':id')(Target, name, descriptor);
                    break;
                case 'store':
                    Post()(Target, name, descriptor);
                    break;
                case 'update':
                    Patch()(Target, name ,descriptor);
                    break;
                case 'delete':
                    Delete()(Target, name, descriptor);
                    break;
                default:
                    break;
            }

            if(!isNil(option.hook)) option.hook(Target, name);
        }
        return Target;
    }