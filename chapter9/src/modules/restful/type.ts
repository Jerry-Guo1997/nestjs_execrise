import { Type } from "@nestjs/common";
import { ClassTransformOptions } from "class-transformer";

export type CurdMethod = 'detail' | 'delete' | 'restore' | 'list' | 'store' | 'update';

export interface CrudMethodOption{
    serialize?: ClassTransformOptions | 'noGroup';
    hook?: (target: Type<any>, method: string) => void;
}

export interface CurdItem{
    name: CurdMethod;
    option?: CrudMethodOption;
}

export interface CurdOptions{
    id: string;
    enabled: Array<CurdMethod | CurdItem>;
    dtos: {
        [key in 'list' | 'store' | 'update']? : Type<any>;
    };
}