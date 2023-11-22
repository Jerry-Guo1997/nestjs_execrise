import { EntityManager, EntityTarget, FindOptionsUtils, FindTreeOptions, ObjectLiteral, QueryRunner, SelectQueryBuilder, TreeRepository, TreeRepositoryUtils } from "typeorm";
import { OrderType, TreeChildrenResolve } from "../constants";
import { isNil, pick, unset } from "lodash";
import { getOrderByQuery } from "../helpers";
import { OrderQueryType, QueryParams } from "../types";

export class BaseTreeRepository<E extends ObjectLiteral> extends TreeRepository<E> {
    protected _qbName = 'treeEntity';

    protected orderBy?: string | { name: string; order: `${OrderType}`};

    protected _childrenResolve?: TreeChildrenResolve;

    constructor(target: EntityTarget<E>, manager: EntityManager, queryRunner?: QueryRunner){
        super(target, manager, queryRunner);
    }

    get qbName() {
        return this._qbName;
    }

    get childrenResolve() {
        return this._childrenResolve;
    }

    buildBaseQB(qb?: SelectQueryBuilder<E>): SelectQueryBuilder<E> {
        const queryBuilder = qb ?? this.createQueryBuilder(this.qbName);
        return queryBuilder.leftJoinAndSelect(`${this.qbName}.parent`,'parent');
    }

    addOrderByQuery(qb: SelectQueryBuilder<E>, orderBy?: OrderQueryType){
        const orderByQuery = orderBy ?? this.orderBy;
        return !isNil(orderByQuery) ? getOrderByQuery(qb, this.qbName, orderByQuery) : qb;
    }

    async findTrees(options?: FindTreeOptions & QueryParams<E>){
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    async findRoots(options?: FindTreeOptions & QueryParams<E>){
        const {addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        let qb = this.addOrderByQuery(this.buildBaseQB(), orderBy);
        qb.where(`${escapeAlias(this.qbName)}.${escapeColumn(parentPropertyName)} is NULL`);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        qb = addQuery ? await addQuery(qb) : qb;
        if(withTrashed){
            qb.withDeleted();
            if(onlyTrashed) qb.where(`${this.qbName}.deleteAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    async findDescendantsTree(entity: E, options?: FindTreeOptions & QueryParams<E>){
        const {addQuery,orderBy,withTrashed,onlyTrashed} = options??{};
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        qb = addQuery   
            ? await addQuery(this.addOrderByQuery(qb,orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if(withTrashed){
            qb.withDeleted();
            if(onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            this.qbName,
            entities.raw,
        );
        TreeRepositoryUtils.buildChildrenEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
            {
                depth: -1,
                ...pick(options, ['relations']),
            },
        );

        return entity;
    }

    async findAncestorsTree(entity: E, options?: FindTreeOptions & QueryParams<E>){
        const {addQuery, orderBy,withTrashed,onlyTrashed} = options ?? {};
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure',entity),
        );
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if(withTrashed){
            qb.withDeleted;
            if(onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);

        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'treeEntity',
            entities.raw,
        );
        TreeRepositoryUtils.buildParentEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
        );
        return entity;
    }

    async fingDescendants(entity: E, options?: FindTreeOptions & QueryParams<E>){
        const {addQuery,orderBy,withTrashed,onlyTrashed} = options ?? {};
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if (withTrashed){
            qb.withDeleted();
            if(onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        return qb.getMany();
    }

    async findAncestors(entity: E, options?: FindTreeOptions & QueryParams<E>){
        const{addQuery,orderBy,withTrashed,onlyTrashed} = options ?? {};
        let qb = this.buildBaseQB(
            this.createAncestorsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if(withTrashed){
            if(onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    async countDescendants(entity: E, options?: FindTreeOptions & QueryParams<E>){
        const {addQuery,orderBy,withTrashed,onlyTrashed} = options ?? {};
        let qb = this.createDescendantsQueryBuilder(this.qbName, 'treeClosure',entity);
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if(withTrashed){
            qb.withDeleted();
            if(onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    async countAncestors(entity: E, options?: FindTreeOptions & QueryParams<E>){
        const {addQuery, orderBy, withTrashed, onlyTrashed} = options ?? {};
        let qb = this.createAncestorsQueryBuilder(this.qbName, 'treeClosure', entity);
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb,orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if(withTrashed){
            qb.withDeleted();
            if(onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    async toFlatTrees(trees: E[], depth = 0, parent: E | null = null): Promise<E[]>{
        const data: Omit<E, 'children'>[] = [];
        for(const item of trees) {
            (item as any).depth = depth;
            (item as any).parent = parent;
            const {children} = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as E[];
    }
}