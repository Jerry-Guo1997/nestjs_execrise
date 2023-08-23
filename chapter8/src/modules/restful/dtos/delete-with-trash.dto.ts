import { DtoValidation } from "@/modules/core/decorators";
import { toBoolean } from "@/modules/core/helpers";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { DeleteDto } from "./delete.dto";

@DtoValidation()
export class DeleteWithTrashDto extends DeleteDto{
    @Transform(({value}) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    trash?: boolean;
}