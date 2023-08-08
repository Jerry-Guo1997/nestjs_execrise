import { Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';

import { EntityNotFoundError } from 'typeorm';

import { treePaginate } from '@/modules/database/helpers';

import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';

import { CategoryEntity } from '../entities';

import { CategoryRepository } from '../repositories';

@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

    /**
     *
     * 查询分类树
     */
    async findTrees() {
        return this.repository.findTrees();
    }

    async paginate(options: QueryCategoryDto) {
        const tree = await this.repository.findTrees();
        const data = await this.repository.toFlatTrees(tree);
        return treePaginate(options, data);
    }

    async detail(id: string) {
        return this.repository.findOneByOrFail({ id });
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

    async delete(id: string) {
        const item = await this.repository.findOneOrFail({
            where: { id },
            relations: ['parent', 'children'],
        });

        if (!isNil(item.children) && item.children.length > 0) {
            const nchildren = [...item.children].map((c) => {
                c.parent = item.parent;
                return item;
            });

            await this.repository.save(nchildren);
        }
        return this.repository.remove(item);
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
