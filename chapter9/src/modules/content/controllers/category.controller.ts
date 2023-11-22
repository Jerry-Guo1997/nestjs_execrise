import {
    Controller,
    Get,
    Query,
    SerializeOptions,
} from '@nestjs/common';

import { CreateCategoryDto, QueryCategoryTreeDto, UpdateCategoryDto } from '../dtos';
import { CategoryService } from '../services';
import { BaseControllerWithTrash } from '@/modules/restful/base/trashed.controller';
import { Crud } from '@/modules/restful/decorators';

// @UseInterceptors(AppIntercepter)
@Crud({
    id: 'category',
    enabled: ['list', 'detail','store','update','delete','restore'],
    dtos: {
        store: CreateCategoryDto,
        update: UpdateCategoryDto,
    },
})
@Controller('categories')
export class CategoryController extends BaseControllerWithTrash<CategoryService>{
    constructor(protected service: CategoryService) {
        super(service);
    }

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    async tree(
        @Query()
        options: QueryCategoryTreeDto
    ) {
        return this.service.findTrees(options);
    }
}