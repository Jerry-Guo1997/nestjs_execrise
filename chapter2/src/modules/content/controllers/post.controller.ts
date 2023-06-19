import { PaginateOptions } from "@/modules/database/types";
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { PostService } from "../services/post.service";

@Controller('posts')
export class PostController{
    constructor(protected service:PostService){}

    @Get()
    async list(
        @Query()
        options: PaginateOptions,
    ){
        return this.service.paginate(options);
    }

    @Get('id')
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ){
        return this.service.detail(id);
    }

    @Post()
    async store(
        @Body()
        data: Record<string,any>,
    ){
        return this.service.create(data);
    }

    @Patch()
    async update(
        @Body()
        data: Record<string,any>,
    ){
        return this.service.update(data);
    }

    @Delete(':id')
    async delete(@Param('id',new ParseUUIDPipe()) id:string){
        return this.service.delete(id);
    }
}