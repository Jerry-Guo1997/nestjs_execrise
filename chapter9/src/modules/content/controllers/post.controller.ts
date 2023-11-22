import {
    Controller,
} from '@nestjs/common';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dtos';
import { PostService } from '../services/post.service';

import { Crud } from '@/modules/restful/decorators';
import { BaseControllerWithTrash } from '@/modules/restful/base/trashed.controller';

// @UseInterceptors(AppIntercepter)
@Crud({
    id:'post',
    enabled: ['list','detail','store','update','delete','restore'],
    dtos: {
        store: CreatePostDto,
        update: UpdatePostDto,
        list: QueryPostDto,
    },
})
@Controller('posts')
export class PostController extends BaseControllerWithTrash<PostService>{
    constructor(protected service: PostService) {
        super(service);
    }

}
