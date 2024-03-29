import { DtoValidation } from "@/modules/core/decorators";
import { IsDefined, IsUUID } from "class-validator";

/**
 * 批量删除验证
 */
@DtoValidation()
export class DeleteDto{
    @IsUUID(undefined, {
        each: true,
        message: 'ID格式错误',
    })
    @IsDefined({
        each: true,
        message: 'ID必须指定',
    })
    ids: string[] = [];
}