import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Query,
    SerializeOptions,
} from '@nestjs/common';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos';
import { CommentService } from '../services';
import { DeleteDto } from '@/modules/restful/dtos/delete.dto';

// @UseInterceptors(AppIntercepter)
@Controller('comments')
export class CommentController {
    constructor(protected service: CommentService) {}

    @Get('tree')
    @SerializeOptions({ groups: ['comment-tree'] })
    async tree(
        @Query()
        query: QueryCommentTreeDto,
    ) {
        return this.service.findTrees(query);
    }

    @Get()
    @SerializeOptions({ groups: ['comment-list'] })
    async list(
        @Query()
        query: QueryCommentDto,
    ) {
        return this.service.paginate(query);
    }

    @Post()
    @SerializeOptions({ groups: ['comment-detail'] })
    async store(
        @Body()
        data: CreateCommentDto,
    ) {
        return this.service.create(data);
    }

    @Delete()
    @SerializeOptions({ groups: ['comment-detail'] })
    async delete(
        @Body() 
        data: DeleteDto
    ) {
        const {ids} = data;
        return this.service.delete(ids);
    }
}
