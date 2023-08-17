import { Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';

import { EntityNotFoundError, In } from 'typeorm';

import { manualPaginate } from '@/modules/database/helpers';

import { CreateCategoryDto, QueryCategoryDto, QueryCategoryTreeDto, UpdateCategoryDto } from '../dtos/category.dto';

import { CategoryEntity } from '../entities';

import { CategoryRepository } from '../repositories';
import { SelectTrashMode } from '@/modules/database/constants';

@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

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

    async paginate(options: QueryCategoryDto) {
        const {trashed = SelectTrashMode.NONE} = options;
        const tree = await this.repository.findTrees({
            withTrashed: trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY,
            onlyTrashed: trashed === SelectTrashMode.ONLY,
        });
        const data = await this.repository.toFlatTrees(tree);
        return manualPaginate(options, data);
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

    async delete(ids: string[], trash?: boolean) {
        const items = await this.repository.find({
            where: { id: In(ids) },
            withDeleted: true,
            relations: ['parent', 'children'],
        });
        for(const item of items){
            if (!isNil(item.children) && item.children.length > 0) {
                const nchildren = [...item.children].map((c) => {
                    c.parent = item.parent;
                    return item;
                });
    
                await this.repository.save(nchildren);
            }
        }
        if(trash){
            const directs = items.filter((item) => !isNil(item.deletedAt));
            const softs = items.filter((item) => isNil(item.deletedAt));
            return [
                ...(await this.repository.remove(directs)),
                ...(await this.repository.softRemove(softs)),
            ];
        }
        
        return this.repository.remove(items);
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

    async restore(ids: string[]){
        const items = await this.repository.find({
            where: {id: In(ids) } as any,
            withDeleted: true,
        });
        //过滤掉不在回收站中的数据
        const trasheds = items.filter((item) => !isNil(item)).map((item) => item.id);
        if(trasheds.length < 0)return [];
        await this.repository.restore(trasheds);
        const qb = await this.repository.buildBaseQB();
        qb.andWhereInIds(trasheds);
        return qb.getMany();
    }
}
