import { Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';

import { EntityNotFoundError} from 'typeorm';

import { CreateCategoryDto, QueryCategoryTreeDto, UpdateCategoryDto } from '../dtos/category.dto';

import { CategoryEntity } from '../entities';

import { CategoryRepository } from '../repositories';
import { SelectTrashMode } from '@/modules/database/constants';
import { BaseService } from '@/modules/database/base/service';

@Injectable()
export class CategoryService extends BaseService<CategoryEntity, CategoryRepository>{
    protected enableTrash = true;

    constructor(protected repository: CategoryRepository) {
        super(repository);
    }

    /**
     *
     * 查询分类树
     */
    async findTrees(options: QueryCategoryTreeDto) {
        const {trashed = SelectTrashMode.NONE} = options;
        return this.repository.findTrees({
            withTrashed: trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY,
            onlyTrashed: trashed === SelectTrashMode.ONLY,
        });
    }


    async create(data: CreateCategoryDto) {
        const item = await this.repository.save({
            ...data,
            parent: await this.getParent(undefined, data.parent),
        });
        return this.detail(item.id);
    }

    async update(data: UpdateCategoryDto) {
        const parent = await this.getParent(data.id, data.parent);
        const querySet = omit(data, ['id', 'parent']);
        if (Object.keys(querySet).length > 0) {
            await this.repository.update(data.id, querySet);
        }
        const cat = await this.detail(data.id);
        const shouldUpdateParent =
            (!isNil(cat.parent) && !isNil(parent) && cat.parent.id !== parent.id) ||
            (isNil(cat.parent) && !isNil(parent)) ||
            (isNil(cat.parent) && isNil(parent));
        // 父类单独更新
        if (parent !== undefined && shouldUpdateParent) {
            cat.parent = parent;
            await this.repository.save(cat);
        }
        return cat;
    }


    protected async getParent(current?: string, id?: string) {
        if (current === id) return undefined;
        let parent: CategoryEntity | undefined;
        if (id !== undefined) {
            if (id === null) return null;
            parent = await this.repository.findOne({ where: { id } });
            if (!parent)
                throw new EntityNotFoundError(CategoryEntity, `Parent category ${id} not exists!`);
        }
        return parent;
    }

}
