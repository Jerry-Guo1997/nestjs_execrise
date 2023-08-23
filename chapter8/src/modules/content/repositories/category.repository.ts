import { unset, pick } from 'lodash';
import { FindOptionsUtils, FindTreeOptions, TreeRepository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators';

import { CategoryEntity } from '../entities';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    /**
     * 构建基础查询器
     */
    buildBaseQB() {
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
    }

    /**
     * 查询树形分类
     */
    async findTrees(
        options?: FindTreeOptions & {
            onlyTrashed?: boolean;
            withTrashed?: boolean;
        },
    ) {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    /**
     * 查询顶级分类
     * @param options
     */
    findRoots(
        options?: FindTreeOptions & {
            onlyTrashed?: boolean;
            withTrashed?: boolean;
        },
    ) {
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        const qb = this.buildBaseQB().orderBy('category.customOrder', 'ASC');
        qb.where(`${escapeAlias('category')}.${escapeColumn(parentPropertyName)} IS NULL`);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        if(options?.withTrashed){
            qb.withDeleted();
            if(options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL` );
        }
        return qb.getMany();
    }

    /**
     * 查询后代元素
     * @param entity 
     * @param options 
     * @returns 
     */
    findDescendants(
        entity: CategoryEntity,
        options?: FindTreeOptions & {
            onlyTrashed?: boolean;
            withTrashed?: boolean;
        },
    ){
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy(`category.cunstomOrder`, 'ASC');
        if(options?.withTrashed){
            qb.withDeleted();
            if(options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    /**
     * 查询祖先元素
     * @param entity 
     * @param options 
     * @returns 
     */
    findAncestors(
        entity: CategoryEntity,
        options?: FindTreeOptions & {
            onlyTrashed?: boolean;
            withTrashed?: boolean;
        },
    ){
        const qb = this.createAncestorsQueryBuilder('category','treeClosure',entity)
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy(`category.cunstomOrder`, 'ASC');
        if(options?.withTrashed){
            qb.withDeleted();
            if(options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    async countDescendants(
        entity:CategoryEntity,
        options?: {withTrashed?: boolean; onlyTrashed?: boolean},
    ){
        const qb = this.createDescendantsQueryBuilder('category','treeClosure', entity);
        if(options?.withTrashed){
            qb.withDeleted();
            if(options.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    async countAncestors(
        entity: CategoryEntity,
        options?: {withTrashed?: boolean, onlyTrashed?: boolean},
    ){
        const qb = this.createAncestorsQueryBuilder('category','treeClosure', entity);
        if(options?.withTrashed){
            qb.withDeleted();
            if(options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }
    /**
     * 创建后代查询器
     */
    createDescendantsQueryBuilder(
        alias: string,
        closureTableAlias: string,
        entity: CategoryEntity,
    ) {
        return super
            .createDescendantsQueryBuilder(alias, closureTableAlias, entity)
            .orderBy(`${alias}.customOrder`, 'ASC');
    }

    /**
     * 创建祖先查询器
     */
    createAncestorsQueryBuilder(alias: string, closureTableAlias: string, entity: CategoryEntity) {
        return super
            .createAncestorsQueryBuilder(alias, closureTableAlias, entity)
            .orderBy(`${alias}.customOrder`, 'ASC');
    }

    /**
     * 打平并展开树
     */
    async toFlatTrees(trees: CategoryEntity[], depth = 0, parent: CategoryEntity | null = null) {
        const data: Omit<CategoryEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            item.parent = parent;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as CategoryEntity[];
    }
}
