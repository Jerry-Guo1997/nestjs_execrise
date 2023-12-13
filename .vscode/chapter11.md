---
title: 数据操作代码的抽象化
sidebar_label: 数据操作代码的抽象化
hide_title: true
sidebar_position: 11
---

本节课主要目的在于抽象出冗余和重复性的数据层操作代码，是代码更加简洁

## 学习目标

- 抽象`Repository`以及`TreeRepository`基类
- 抽象`Subscriber`
- 抽象`Service`
- ~~构建一个`CRUD`框架~~(为了保证代码的易读性，本部分已弃用，如有需要可以查看旧课文档或代码学习，会对TS有一个提升层次的理解)

## 文件结构
本节课修改的文件结构集中于`database`模块，如下
```shell
./src/modules/database/base
├── index.ts
├── repository.ts # 基础存储类
├── service.ts # 基础服务类
├── subcriber.ts # 基础订阅者类
└── tree.repository.ts # 基础树形存储类
```
## 代码编写
### BaseRepository
创建一个基础的`Repository`类，并把此类设置为抽象类

```typescript
// src/modules/database/base/repository.ts

/**
 * 基础存储类
 */
export abstract class BaseRepository<E extends ObjectLiteral> extends Repository<E> {}
```

然后添加以下数据和方法

#### query查询名称
`_qbName`与`get qbName`用于在构建queryBuilder时指定和获取默认的`queryname`，比如`this.createQueryBuilder(this.qbName)`，其中`_qbName`为抽象属性，所以必须在子类中实现

```typescript
/**
 * 基础存储类
 */
export abstract class BaseRepository<E extends ObjectLiteral> extends Repository<E> {
    /**
     * 构建查询时默认的模型对应的查询名称
     */
    protected abstract _qbName: string;

    /**
     * 返回查询器名称
     */
    get qbName() {
        return this._qbName;
    }
}
```

#### 构建基本QueryBuilder
`buildBaseQB`用于构建一个默认的queryBuilder，可以通过子类重载该方法以构建一个自定义的默认的queryBuilder生成器

```typescript
/**
 * 基础存储类
 */
export abstract class BaseRepository<E extends ObjectLiteral> extends Repository<E> {
    ...
    /**
     * 构建基础查询器
     */
    buildBaseQB(): SelectQueryBuilder<E> {
        return this.createQueryBuilder(this.qbName);
    }
}
```

#### 默认排序与自定义排序
`orderBy`属性用于指定默认的排序规则（可选），如果是一个字符串字段则默认对该字段进行`DESC`排序，如果是一个对象，则使用该对象进行排序
此处我们需要先添加一个排序类型常量，用于指定升序或降序
```typescript
  // src/modules/database/constants.ts
  /**
   * 排序方式
   */
  export enum OrderType {
      ASC = 'ASC',
      DESC = 'DESC',
  }
```
`addOrderByQuery`方法用于为传入的queryBuilder实例添加上一个排序规则，默认添加通过上面的`orderBy`属性来排序，也可以传入一个自定义的参数作为排序规则。然后通过`getOrderByQuery`为`qb`实例添加上排序规则，`getOrderByQuery`的实现如下
首先添加一个排序类型，该类型可以是一个字符串，或者对象，或者排序对象列表，如下

```typescript
 // src/modules/database/types.ts
 /**
  * 排序类型,{字段名称: 排序方法}
  * 如果多个值则传入数组即可
  * 排序方法不设置,默认DESC
  */
 export type OrderQueryType =
     | string
     | { name: string; order: `${OrderType}` }
     | Array<{ name: string; order: `${OrderType}` } | string>;
```
接下来实现方法

- 当没有传入`orderBy`参数时直接返回传入的queryBuilder实例
- 当`orderBy`是一个字符串时，默认使用`DESC`降序排序
- 当`orderBy`是一个对象时，我们添加这个排序名称和排序规则
- 当`orderBy`是一个数组时，循环添加所有排序
```typescript
// src/modules/database/helpers.ts
/**
 * 为查询添加排序,默认排序规则为DESC
 * @param qb 原查询
 * @param alias 别名
 * @param orderBy 查询排序
 */
export const getOrderByQuery = <E extends ObjectLiteral>(
    qb: SelectQueryBuilder<E>,
    alias: string,
    orderBy?: OrderQueryType,
) => {
    if (isNil(orderBy)) return qb;
    if (typeof orderBy === 'string') return qb.orderBy(`${alias}.${orderBy}`, 'DESC');
    if (Array.isArray(orderBy)) {
        for (const item of orderBy) {
            typeof item === 'string'
                ? qb.addOrderBy(`${alias}.${item}`, 'DESC')
                : qb.addOrderBy(`${alias}.${item.name}`, item.order);
        }
        return qb;
    }
    return qb.orderBy(`${alias}.${(orderBy as any).name}`, (orderBy as any).order);
};
```
最后实现`addOrderByQuery`方法，如下
```typescript
// src/modules/database/base/repository.ts  
/**
 * 基础存储类
 */
export abstract class BaseRepository<E extends ObjectLiteral> extends Repository<E> {
    ...

    /**
     * 默认排序规则，可以通过每个方法的orderBy选项进行覆盖
     */
    protected orderBy?: string | { name: string; order: `${OrderType}` };

    /**
     * 生成排序的QueryBuilder
     * @param qb
     * @param orderBy
     */
    addOrderByQuery(qb: SelectQueryBuilder<E>, orderBy?: OrderQueryType) {
        const orderByQuery = orderBy ?? this.orderBy;
        return !isNil(orderByQuery) ? getOrderByQuery(qb, this.qbName, orderByQuery) : qb;
    }
}
```
#### 使用方法
使`PostRepository`和`TagRepository`继承这个自定义的`BaseRepository`
```typescript
// src/modules/content/repositories/post.repository.ts
@CustomRepository(PostEntity)
export class PostRepository extends BaseRepository<PostEntity> {
    protected _qbName = 'post';

    buildBaseQB() {
        // 在查询之前先查询出评论数量在添加到commentCount字段上
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.categories`, 'categories')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where('c.post.id = post.id');
            }, 'commentCount')
            .loadRelationCountAndMap(`${this.qbName}.commentCount`, `${this.qbName}.comments`);
    }
}

// src/modules/content/repositories/tag.repository.ts
@CustomRepository(TagEntity)
export class TagRepository extends BaseRepository<TagEntity> {
    protected _qbName = 'tag';

    buildBaseQB() {
        return this.createQueryBuilder('tag')
            .leftJoinAndSelect('tag.posts', 'posts')
            .addSelect(
                (subQuery) => subQuery.select('COUNT(p.id)', 'count').from(PostEntity, 'p'),
                'postCount',
            )
            .orderBy('postCount', 'DESC')
            .loadRelationCountAndMap('tag.postCount', 'tag.posts');
    }
}
```
### BaseTreeRepository
`BaseTreeRepository`不需要成为一个抽象类，因为`_qbName`默认为`treeEntity`

-  `qbName`与`get qbName`的作用与`BaseRepository`同 
-  `orderBy`属性与`BaseRepository`同 
-  `buildBaseQB`与`BaseRepository`同，但是添加了一个`leftJoinAndSelect`，以自动加入`parent` 
-  `addOrderByQuery`方法与`BaseRepository`同 
```typescript
// src/modules/database/base/tree.repository.ts
/**
 * 基础树形存储类
 */
export class BaseTreeRepository<E extends ObjectLiteral> extends TreeRepository<E> {
    /**
     * 查询器名称
     */
    protected _qbName = 'treeEntity';
  
     /**
     * 删除父分类后是否提升子分类的等级
     */
    protected _childrenResolve?: TreeChildrenResolve;

    /**
     * 默认排序规则，可以通过每个方法的orderBy选项进行覆盖
     */
    protected orderBy?: string | { name: string; order: `${OrderType}` };

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(target: EntityTarget<E>, manager: EntityManager, queryRunner?: QueryRunner) {
        super(target, manager, queryRunner);
    }

    /**
     * 返回查询器名称
     */
    get qbName() {
        return this._qbName;
    }
  
    /**
     * 返回子分类的等级
     */
    get childrenResolve() {
        return this._childrenResolve;
    }

    /**
     * 构建基础查询器
     */
    buildBaseQB(qb?: SelectQueryBuilder<E>): SelectQueryBuilder<E> {
        const queryBuilder = qb ?? this.createQueryBuilder(this.qbName);
        return queryBuilder.leftJoinAndSelect(`${this.qbName}.parent`, 'parent');
    }

    /**
     * 生成排序的QueryBuilder
     * @param qb
     * @param orderBy
     */
    addOrderByQuery(qb: SelectQueryBuilder<E>, orderBy?: OrderQueryType) {
        const orderByQuery = orderBy ?? this.orderBy;
        return !isNil(orderByQuery) ? getOrderByQuery(qb, this.qbName, orderByQuery) : qb;
    }
}
```

#### 子节点处理
`_childrenResolve`与`get childrenResolve`用于确定在删除时是如何对子孙数据进行操作的，对应的枚举类型常量如下

- `DELETE`: 在删除父节点时同时删除它的子孙节点
- `UP`: 在删除父节点时把它的子孙节点提升一级
- `ROOT`: 在删除父节点时把它的子节点提升为顶级节点
```typescript
// src/modules/database/constants.ts
/**
 * 树形模型在删除父级后子级的处理方式
 */
export enum TreeChildrenResolve {
    DELETE = 'delete',
    UP = 'up',
    ROOT = 'root',
}
```
#### 整棵树查询
`findTrees`方法用于查询整个树的树形结构数据
我们添加一个`QueryParams`类型，用于为该方法的选项参数添加额外的选项

- `addQuery`用于添加额外的回调查询
- `orderBy`: 用于覆盖默认的`orderBy`属性的自定义排序方式
- `withTrashed`: 用于查询具有软删除功能的模型时把回收站中的数据也查询出来
- `onlyTrashed`: 用于查询具有软删除功能的模型时只查询回收站中的数据（前提是`withTrashed`必须是`true`）
```typescript
// src/modules/database/types.ts
/**
 * 数据列表查询类型
 */
export interface QueryParams<E extends ObjectLiteral> {
    addQuery?: QueryHook<E>;
    orderBy?: OrderQueryType;
    withTrashed?: boolean;
    onlyTrashed?: boolean;
}
```
方法的具体实现非常简单，分为两步

1. 通过`findRoots`方法查询出顶级节点
2. 遍历顶级节点，通过`findDescendantsTree`方法查询出每个顶级节点的子孙节点树，并把树添加到当前的顶级节点

```typescript
/**
 * 基础树形存储类
 */
export class BaseTreeRepository<E extends ObjectLiteral> extends TreeRepository<E> {
    ...
    /**
     * 查询树形分类
     * @param options
     */
    async findTrees(options?: FindTreeOptions & QueryParams<E>) {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }
}
```
#### 其它查询方法
`findRoots`,`findDescendantsTree`,`findAncestorsTree`,`findDescendants`,`findAncestors`,`countDescendants`,`countAncestors`分别用于查询顶级节点，查询子孙节点树，查询祖先节点树，查询子孙节点列表，查询祖先节点列表，查询子孙节点的数量，查询祖先节点的数量
这些方法的参数类型都在原来的`FindTreeOptions`基础上增加了`QueryParams`，以便支持更多的查询操作。
以`findAncestorsTree`为例，可以看到我们重载了原本的`findDescedantsTree`方法，并且添加了**额外查询回调**，**排序**，**回收站**等查询功能

:::info

重载的方法是把TypeORM默认的`TreeRepository`中的这些方法的源码复制下来修改，源码在[这里](https://github.com/typeorm/typeorm/blob/master/src/repository/TreeRepository.ts)

:::

```typescript
/**
 * 基础树形存储类
 */
export class BaseTreeRepository<E extends ObjectLiteral> extends TreeRepository<E> {
    ...
    /**
     * 查询后代树
     * @param entity
     * @param options
     */
    async findDescendantsTree(entity: E, options?: FindTreeOptions & QueryParams<E>) {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
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
}
```
#### 打平树
`toFlatTrees`方法就是原来`categoryRepository`与`commentRepository`中的`toFlatTrees`，即把查询出来的树形结构的数据给打平
```typescript
/**
 * 基础树形存储类
 */
export class BaseTreeRepository<E extends ObjectLiteral> extends TreeRepository<E> {
    ...

    /**
     * 打平并展开树
     * @param trees
     * @param level
     */
    async toFlatTrees(trees: E[], depth = 0, parent: E | null = null): Promise<E[]> {
        const data: Omit<E, 'children'>[] = [];
        for (const item of trees) {
            (item as any).depth = depth;
            (item as any).parent = parent;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as E[];
    }
}
```
接下来我们使`commentRepository`与`CategoryRepository`都继承这个自定义的基础`TreeRepository`类，可以看到很多重复性的冗余代码就无需再写了
```typescript
// src/modules/content/repositories/category.repository.ts
@CustomRepository(CategoryEntity)
export class CategoryRepository extends BaseTreeRepository<CategoryEntity> {
      protected _qbName = 'category';

      protected orderBy = { name: 'customOrder', order: OrderType.ASC };

      protected _childrenResolve = TreeChildrenResolve.UP;
}

// src/modules/content/repositories/comment.repository.ts
@CustomRepository(CommentEntity)
export class CommentRepository extends BaseTreeRepository<CommentEntity> {
    protected _qbName = 'comment';

    protected orderBy = 'createdAt';

    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return super.buildBaseQB(qb).leftJoinAndSelect(`${this.qbName}.post`, 'post');
    }

    async findTrees(
        options: FindTreeOptions & QueryParams<CommentEntity> & { post?: string } = {},
    ): Promise<CommentEntity[]> {
        return super.findTrees({
            ...options,
            addQuery: async (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }
}
```
### BaseService
首先需要增加一些类型，如下

:::info

具体作用看注释，详细使用请参照下面的`BaseService`

:::

```typescript
// src/modules/database/types.ts
/**
 * 服务类数据列表查询类型
 */
export type ServiceListQueryOption<E extends ObjectLiteral> =
    | ServiceListQueryOptionWithTrashed<E>
    | ServiceListQueryOptionNotWithTrashed<E>;

/**
 * 带有软删除的服务类数据列表查询类型
 */
type ServiceListQueryOptionWithTrashed<E extends ObjectLiteral> = Omit<
    FindTreeOptions & QueryParams<E>,
    'withTrashed'
> & {
    trashed?: `${SelectTrashMode}`;
} & Record<string, any>;

/**
 * 不带软删除的服务类数据列表查询类型
 */
type ServiceListQueryOptionNotWithTrashed<E extends ObjectLiteral> = Omit<
    ServiceListQueryOptionWithTrashed<E>,
    'trashed'
>;
```
`BaseService`用于提供一些基本的CRUD操作

```typescript
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
> {
    /**
     * 服务默认存储类
     */
    protected repository: R;

    /**
     * 是否开启软删除功能
     */
    protected enableTrash = false;

    constructor(repository: R) {
        this.repository = repository;
        if (
            !(
                this.repository instanceof BaseRepository ||
                this.repository instanceof BaseTreeRepository
            )
        ) {
            throw new Error(
                'Repository must instance of BaseRepository or BaseTreeRepository in DataService!',
            );
        }
    }
}
```

包含以下属性和方法

#### 注入Repository
`repository`属性用于设置默认的Repository实例，该实例的类必须继承自上述自定义的`BaseRepository`以及`BaseTreeRepository`，通过子类使用注入依赖的方式进行实例化，并且通过调用这个`BaseService`的`constructor`方法来传入赋值，比如:

```typescript
constructor(protected repository: CategoryRepository) {
    super(repository);
}
```
#### 软删除支持
`enableTrash`属性用于确定该服务所操作的模型是否支持软删除
#### 单条数据查询构建器

`buildItemQB`方法用于构建查询单条数据详情的querybuilder，接受3个参数，分别为待查询数据的ID，`qb`实例以及操作`qb`的回调函数，代码如下:

```typescript
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
> {
    ...

    /**
     * 获取查询单个项目的QueryBuilder
     * @param id 查询数据的ID
     * @param qb querybuilder实例
     * @param callback 查询回调
     */
    protected async buildItemQB(id: string, qb: SelectQueryBuilder<E>, callback?: QueryHook<E>) {
        qb.where(`${this.repository.qbName}.id = :id`, { id });
        if (callback) return callback(qb);
        return qb;
    }
}

```
#### 数据列表查询构建器
`buildListQB`方法用于构建查询普通（非树形）结构的数据列表的queryBuilder，其逻辑为：如果查询时，有传入`trashed`参数，且当该参数是`all`或者`only`时同时会查询回收站中的数据（前提是开启`this.enableTrash`）,如果`trashed`是`only`，则只查询回收站中的数据。另外如果有回调查询函数则返回回调执行后的`qb`，否则直接返回`qb`，代码如下:
```typescript
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
> {
   ...

    /**
     * 获取查询数据列表的 QueryBuilder
     * @param qb querybuilder实例
     * @param options 查询选项
     * @param callback 查询回调
     */
    protected async buildListQB(qb: SelectQueryBuilder<E>, options?: P, callback?: QueryHook<E>) {
        const { trashed } = options ?? {};
        const queryName = this.repository.qbName;
        // 是否查询回收站
        if (
            this.enableTrash &&
            (trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY)
        ) {
            qb.withDeleted();
            if (trashed === SelectTrashMode.ONLY) {
                qb.where(`${queryName}.deletedAt is not null`);
            }
        }
        if (callback) return callback(qb);
        return qb;
    }
}
```
#### 数据列表查询

:::info

首先需要在雷伤添加一个泛型`P`用于设置查询选项的接口类型

:::

`list`方法用于查询数据列表，通过`this.repository`属性所属类的基类类型来判断查询的模型是树形还是普通模型。在查询普通（非树形）结构的数据列表时使用`buildListQB`来构建queryBuilder并使用`getMany`来获取数据，在查询树形数据列表时，先计算出`withTrashed`和`onlyTrashed`，并合并其它选项传入`findTrees`来获取数据树，然后再使用`toFlatTrees`来生成扁平化数据

```typescript
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
    P extends ServiceListQueryOption<E> = ServiceListQueryOption<E>,
> {
    ...

    /**
     * 获取数据列表
     * @param params 查询参数
     * @param callback 回调查询
     */
    async list(options?: P, callback?: QueryHook<E>): Promise<E[]> {
        const { trashed: isTrashed = false } = options ?? {};
        const trashed = isTrashed || SelectTrashMode.NONE;
        if (this.repository instanceof BaseTreeRepository) {
            const withTrashed =
                this.enableTrash &&
                (trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY);
            const onlyTrashed = this.enableTrash && trashed === SelectTrashMode.ONLY;
            const tree = await this.repository.findTrees({
                ...options,
                withTrashed,
                onlyTrashed,
            });
            return this.repository.toFlatTrees(tree);
        }
        const qb = await this.buildListQB(this.repository.buildBaseQB(), options, callback);
        return qb.getMany();
    }
}
```
#### 分页数据查询

`paginate`方法用于查询分页后的数据列表，接受两个参数：`options`为分页选项，`callback`为querybuilder实例的回调函数。其执行逻辑为：如果`this.repository`属性所属类的基类是`BaseTreeRepository`，则先使用`list`查询出打平后的数据，再使用`treePaginate`函数对数据进行手动分页；如果基类是`BaseRepository`，则先使用`buildListQB`构建数据列表查询的queryBuilder实例，再返回使用`paginate`函数进行分页后的数据

```typescript
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
    P extends ServiceListQueryOption<E> = ServiceListQueryOption<E>,
> {
    ...
    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 回调查询
     */
    async paginate(
        options?: PaginateOptions & P,
        callback?: QueryHook<E>,
    ): Promise<PaginateReturn<E>> {
        const queryOptions = (options ?? {}) as P;
        if (this.repository instanceof BaseTreeRepository) {
            const data = await this.list(queryOptions, callback);
            return treePaginate(options, data) as PaginateReturn<E>;
        }
        const qb = await this.buildListQB(this.repository.buildBaseQB(), queryOptions, callback);
        return paginate(qb, options);
    }
}
```
单条数据查询
`detail`用于根据传入的ID来查询一条数据的详情。首先使用`buildItemQB`构建查询的queryBuilder实例，然后通过该`qb`的`getOne`方法来查询出数据并返回
```typescript
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
    P extends ServiceListQueryOption<E> = ServiceListQueryOption<E>,
> {
    ...
    /**
     * 获取数据详情
     * @param id
     * @param trashed 查询时是否包含已软删除的数据
     * @param callback 回调查询
     */
    async detail(id: string, callback?: QueryHook<E>): Promise<E> {
        const qb = await this.buildItemQB(id, this.repository.buildBaseQB(), callback);
        const item = await qb.getOne();
        if (!item) throw new NotFoundException(`${this.repository.qbName} ${id} not exists!`);
        return item;
    }
}
```
#### 数据删除
`delete`方法用于根据传入的ID列表来删除数据。

1. 判断删除操作针对的模型是否为树形模型，对应不同的操作 
   - 如果是树形模型的话，根据自定义的repository的`childrenResolve`属性先对其子孙数据进行处理（提升到顶级节点/提升一级/直接删除），其中提升到顶级节点/直接删除由`TreeParent`的`onDelete`选项自动操作
   - 如果不是属性模型则直接查询出要删除的数据
2. 根据是否开启软删除进行不同操作 
   - 如果开启软删除且本次删除为软删除的情况下，对上面查询出的待删除中的数据中已经处于回收站状态的数据直接删除掉， 而对于不处于回收站的数据则使用软删除放入回收站
   - 如果不是软删除，那么直接使用`remove`方法对数据进行硬删除即可
3. 最后返回软删除或硬删除之后的数据列表

具体实现如下
```typescript
import { NotFoundException } from '@nestjs/common';
import { isNil } from 'lodash';
import { In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { SelectTrashMode, TreeChildrenResolve } from '../constants';
import { paginate, treePaginate } from '../helpers';
import { PaginateOptions, PaginateReturn, QueryHook, ServiceListQueryOption } from '../types';

import { BaseRepository } from './repository';
import { BaseTreeRepository } from './tree.repository';
/**
 *  CRUD操作服务
 */
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
    P extends ServiceListQueryOption<E> = ServiceListQueryOption<E>,
> {
    ...

    /**
     * 批量删除数据
     * @param data 需要删除的id列表
     * @param trash 是否只扔到回收站,如果为true则软删除
     */
    async delete(ids: string[], trash?: boolean) {
        let items: E[] = [];
        if (this.repository instanceof BaseTreeRepository) {
            items = await this.repository.find({
                where: { id: In(ids) as any },
                withDeleted: this.enableTrash ? true : undefined,
                relations: ['parent', 'children'],
            });
            if (this.repository.childrenResolve === TreeChildrenResolve.UP) {
                for (const item of items) {
                    if (isNil(item.children) || item.children.length <= 0) continue;
                    const nchildren = [...item.children].map((c) => {
                        c.parent = item.parent;
                        return item;
                    });
                    await this.repository.save(nchildren);
                }
            }
        } else {
            items = await this.repository.find({
                where: { id: In(ids) as any },
                withDeleted: this.enableTrash ? true : undefined,
            });
        }
        if (this.enableTrash && trash) {
            const directs = items.filter((item) => !isNil(item.deletedAt));
            const softs = items.filter((item) => isNil(item.deletedAt));
            return [
                ...(await this.repository.remove(directs)),
                ...(await this.repository.softRemove(softs)),
            ];
        }
        return this.repository.remove(items);
    }
}
```
#### 数据恢复
`restore`方法用于恢复回收站中的数据

1. 如果没有开启`enableTrash`则直接抛出异常
2. 查出待恢复的数据
3. 过滤掉非处于回收站的数据
4. 把处于回收站的数据恢复出来
5. 使用`buildListQB`方法把恢复后的数据查询出来并返回

具体代码如下
```typescript
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
    P extends ServiceListQueryOption<E> = ServiceListQueryOption<E>,
> {
    ...

    /**
     * 批量恢复回收站中的数据
     * @param data 需要恢复的id列表
     */
    async restore(ids: string[]) {
        if (!this.enableTrash) {
            throw new ForbiddenException(
                `Can not to retore ${this.repository.qbName},because trash not enabled!`,
            );
        }
        const items = await this.repository.find({
            where: { id: In(ids) as any },
            withDeleted: true,
        });
        const trasheds = items.filter((item) => !isNil(item)).map((item) => item.id);
        if (trasheds.length < 1) return [];
        await this.repository.restore(trasheds);
        const qb = await this.buildListQB(
            this.repository.buildBaseQB(),
            undefined,
            async (builder) => builder.andWhereInIds(trasheds),
        );
        return qb.getMany();
    }
}
```
#### 创建与更新

由于每个模型的数据结构不同，没有通用性可言，所以`create`方法和`update`方法我们交给子类去完整实现，在基础类中只定义一个基本的框架，如果子类没有实现，则在控制器中调用时抛出异常即可 

```typescript
// src/modules/database/base/service.ts
export abstract class BaseService<
    E extends ObjectLiteral,
    R extends BaseRepository<E> | BaseTreeRepository<E>,
    P extends ServiceListQueryOption<E> = ServiceListQueryOption<E>,
> {
    ...

    /**
     * 创建数据,如果子类没有实现则抛出404
     * @param data 请求数据
     * @param others 其它参数
     */
    create(data: any, ...others: any[]): Promise<E> {
        throw new ForbiddenException(`Can not to create ${this.repository.qbName}!`);
    }

    /**
     * 更新数据,如果子类没有实现则抛出404
     * @param data 请求数据
     * @param others 其它参数
     */
    update(data: any, ...others: any[]): Promise<E> {
        throw new ForbiddenException(`Can not to update ${this.repository.qbName}!`);
    }
}
```

#### 使用方法

修改分类，文章以及评论服务，使它们继承这个服务基类，现在理论上我们只要实现每个服务的创建与更新方法即可，需要注意的是

- 因为`PostService`涉及到全文搜索，根据请求排序，查找分类的子孙分类下的文章等等一些比较特殊查询，所以我们需要重装`buildListQB`方法来实现
- `CommentService`没有更新功能，并且不需要开启`enableTrash`
- `CategoryService`与`CommentService`都增加了一个`findTrees`方法用于查询整棵树

`CategoryService`代码如下

```typescript
// src/modules/content/services/category.service.ts

@Injectable()
export class CategoryService extends BaseService<CategoryEntity, CategoryRepository> {
    protected enableTrash = true;

    constructor(protected repository: CategoryRepository) {
        super(repository);
    }

    /**
     * 查询分类树
     */
    async findTrees(options: QueryCategoryTreeDto) {
        const { trashed = SelectTrashMode.NONE } = options;
        return this.repository.findTrees({
            withTrashed: trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY,
            onlyTrashed: trashed === SelectTrashMode.ONLY,
        });
    }

    /**
     * 获取分页数据
     * @param options 分页选项
     */
    async paginate(options: QueryCategoryDto) {
        const { trashed = SelectTrashMode.NONE } = options;
        const tree = await this.repository.findTrees({
            withTrashed: trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY,
            onlyTrashed: trashed === SelectTrashMode.ONLY,
        });
        const data = await this.repository.toFlatTrees(tree);
        return treePaginate(options, data);
    }

    /**
     * 获取数据详情
     * @param id
     */
    async detail(id: string) {
        return this.repository.findOneOrFail({
            where: { id },
            relations: ['parent'],
        });
    }

    /**
     * 新增分类
     * @param data
     */
    async create(data: CreateCategoryDto) {
        const item = await this.repository.save({
            ...data,
            parent: await this.getParent(undefined, data.parent),
        });
        return this.detail(item.id);
    }

    /**
     * 更新分类
     * @param data
     */
    async update(data: UpdateCategoryDto) {
        await this.repository.update(data.id, omit(data, ['id', 'parent']));
        await this.detail(data.id);
        const item = await this.repository.findOneOrFail({
            where: { id: data.id },
            relations: ['parent'],
        });
        const parent = await this.getParent(item.parent?.id, data.parent);
        const shouldUpdateParent =
            (!isNil(item.parent) && !isNil(parent) && item.parent.id !== parent.id) ||
            (isNil(item.parent) && !isNil(parent)) ||
            (!isNil(item.parent) && isNil(parent));
        // 父分类单独更新
        if (parent !== undefined && shouldUpdateParent) {
            item.parent = parent;
            await this.repository.save(item, { reload: true });
        }
        return item;
    }

    /**
     * 获取请求传入的父分类
     * @param current 当前分类的ID
     * @param id
     */
    protected async getParent(current?: string, parentId?: string) {
        if (current === parentId) return undefined;
        let parent: CategoryEntity | undefined;
        if (parentId !== undefined) {
            if (parentId === null) return null;
            parent = await this.repository.findOne({ where: { id: parentId } });
            if (!parent)
                throw new EntityNotFoundError(
                    CategoryEntity,
                    `Parent category ${parentId} not exists!`,
                );
        }
        return parent;
    }
}
```
`TagService`代码如下

```typescript
// src/modules/content/services/tag.service.ts
@Injectable()
export class TagService extends BaseService<TagEntity, TagRepository> {
    protected enableTrash = true;
    constructor(protected repository: TagRepository) {
        super(repository);
    }

    /**
     * 创建标签
     * @param data
     */
    async create(data: CreateTagDto) {
        const item = await this.repository.save(data);
        return this.detail(item.id);
    }

    /**
     * 更新标签
     * @param data
     */
    async update(data: UpdateTagDto) {
        await this.repository.update(data.id, omit(data, ['id']));
        return this.detail(data.id);
    }
}
```

`PostService`代码如下(就只是为了类型不报错把`this.searchService.search`返回值改成`any`)

```typescript
// src/modules/content/services/post.service.ts
@Injectable()
export class PostService extends BaseService<PostEntity, PostRepository, FindParams> {
    protected enableTrash = true;
    ...
    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        if (!isNil(this.searchService) && !isNil(options.search) && this.search_type === 'meilli') {
            return this.searchService.search(
                options.search,
                pick(options, ['trashed', 'page', 'limit']),
            ) as any;
        }
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }
}

```

`CommentService`代码如下(`CommentService`不需要设置`enableTrash`)

```typescript
// src/modules/content/services/comment.service.ts
@Injectable()
export class CommentService extends BaseService<CommentEntity, CommentRepository> {
    constructor(
        protected repository: CommentRepository,
        protected postRepository: PostRepository,
    ) {
        super(repository);
    }

    /**
     * 直接查询评论树
     * @param options
     */
    async findTrees(options: QueryCommentTreeDto = {}) {
        return this.repository.findTrees({
            addQuery: async (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }

    /**
     * 查找一篇文章的评论并分页
     * @param dto
     */
    async paginate(options: QueryCommentDto) {
        const { post } = options;
        const addQuery = (qb: SelectQueryBuilder<CommentEntity>) => {
            const condition: Record<string, string> = {};
            if (!isNil(post)) condition.post = post;
            return Object.keys(condition).length > 0 ? qb.andWhere(condition) : qb;
        };
        return super.paginate({
            ...options,
            addQuery,
        });
    }

    /**
     * 新增评论
     * @param data
     * @param user
     */
    async create(data: CreateCommentDto) {
        const parent = await this.getParent(undefined, data.parent);
        if (!isNil(parent) && parent.post.id !== data.post) {
            throw new ForbiddenException('Parent comment and child comment must belong same post!');
        }
        const item = await this.repository.save({
            ...data,
            parent,
            post: await this.getPost(data.post),
        });
        return this.repository.findOneOrFail({ where: { id: item.id } });
    }

    /**
     * 获取评论所属文章实例
     * @param id
     */
    protected async getPost(id: string) {
        return !isNil(id) ? this.postRepository.findOneOrFail({ where: { id } }) : id;
    }

    /**
     * 获取请求传入的父分类
     * @param current 当前分类的ID
     * @param id
     */
    protected async getParent(current?: string, id?: string) {
        if (current === id) return undefined;
        let parent: CommentEntity | undefined;
        if (id !== undefined) {
            if (id === null) return null;
            parent = await this.repository.findOne({
                relations: ['parent', 'post'],
                where: { id },
            });
            if (!parent) {
                throw new EntityNotFoundError(CommentEntity, `Parent comment ${id} not exists!`);
            }
        }
        return parent;
    }
}
```

### BaseSubscriber

:::tip

请在学习下面代码前先学习一下[TypeORM的监听与订阅者文档](https://typeorm.io/listeners-and-subscribers)

:::

在实现订阅者基类前我们先定义个类型

```typescript
// src/modules/database/types.ts
/**
 * Repository类型
 */
export type RepositoryType<E extends ObjectLiteral> =
    | Repository<E>
    | TreeRepository<E>
    | BaseRepository<E>
    | BaseTreeRepository<E>;
```
接下来我们编写一个`getCustomRepository`函数，此函数用于获取一个自定义Repository的实例
```typescript
// src/modules/database/helpers.ts
/**
 * 获取自定义Repository的实例
 * @param dataSource 数据连接池
 * @param Repo repository类
 */
export const getCustomRepository = <T extends Repository<E>, E extends ObjectLiteral>(
    dataSource: DataSource,
    Repo: ClassType<T>,
): T => {
    if (isNil(Repo)) return null;
    const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);
    if (!entity) return null;
    const base = dataSource.getRepository<ObjectType<any>>(entity);
    return new Repo(base.target, base.manager, base.queryRunner) as T;
};
```
#### 具体实现
下面来实现一下这个`BaseSubscriber`，此类为抽象类

- `entity`属性用于设置模型，是子类必须设置的一个抽象属性
- `constructor`构造函数可以在子类中用`super`方法调用，以注入`dataSource`对象，并把当前的`subscriber`实例添加到当前的数据库连接`dataSource`中
- `getDataSource`方法用于获取当前的数据库连接实例
- `getManage`方法用于获取当前数据库连接的`entityManage`对象
- `getRepositoy`方法用于获取一个模型（默认为`this.entity`属性）的自定义Repository的实例，如果没有传入自定义Repository类则直接获取该模型的默认Repository实例
- `listenTo`用于监听模型
- `afterLoad`方法用于在加载模型后对数据进行进一步处理，目前的作用是：判断当前模型是否为树形模型，如果是且没有设置`depth`虚拟字段，则把该字段的值设置成`0`
- `isUpdated`方法用于判断判断某个字段是否被更新
```typescript
// src/modules/database/base/subcriber.ts
/**
 * 基础模型观察者
 */
type SubscriberEvent<E extends ObjectLiteral> =
    | InsertEvent<E>
    | UpdateEvent<E>
    | SoftRemoveEvent<E>
    | RemoveEvent<E>
    | RecoverEvent<E>
    | TransactionStartEvent
    | TransactionCommitEvent
    | TransactionRollbackEvent;

/**
 * 基础模型观察者
 */
@EventSubscriber()
export abstract class BaseSubscriber<E extends ObjectLiteral>
    implements EntitySubscriberInterface<E>
{
    /**
     * 监听的模型
     */
    protected abstract entity: ObjectType<E>;

    /**
     * 构造函数
     * @param dataSource 数据连接池
     */
    constructor(@Optional() protected dataSource?: DataSource) {
        if (!isNil(this.dataSource)) this.dataSource.subscribers.push(this);
    }

    protected getDataSource(event: SubscriberEvent<E>) {
        return this.dataSource ?? event.connection;
    }

    protected getManage(event: SubscriberEvent<E>) {
        return this.dataSource ? this.dataSource.manager : event.manager;
    }

    listenTo() {
        return this.entity;
    }

    async afterLoad(entity: any) {
        // 是否启用树形
        if ('parent' in entity && isNil(entity.depth)) entity.depth = 0;
    }

    protected getRepositoy<
        C extends ClassType<T>,
        T extends RepositoryType<E>,
        A extends EntityTarget<ObjectLiteral>,
    >(event: SubscriberEvent<E>, repository?: C, entity?: A) {
        return isNil(repository)
            ? this.getDataSource(event).getRepository(entity ?? this.entity)
            : getCustomRepository<T, E>(this.getDataSource(event), repository);
    }

    /**
     * 判断某个字段是否被更新
     * @param cloumn
     * @param event
     */
    protected isUpdated(cloumn: keyof E, event: UpdateEvent<E>) {
        return !!event.updatedColumns.find((item) => item.propertyName === cloumn);
    }
}
```
#### 使用方法
接下来使`PostSubscriber`继承这个类，并重载`afterLoad`方法即可
```typescript
// src/modules/content/subscribers/post.subscriber.ts
/**
 * 文章模型观察者
 */
@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity = PostEntity;

    constructor(
        protected dataSource: DataSource,
        protected postRepository: PostRepository,
        @Optional() protected sanitizeService?: SanitizeService,
    ) {
        super(dataSource);
    }

    listenTo() {
        return PostEntity;
    }

    /**
     * 加载文章数据的处理
     * @param entity
     */
    async afterLoad(entity: PostEntity) {
        if (entity.type === PostBodyType.HTML) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
```
### 关于测试

本节课只是对原有的代码进行一下抽象化，已减少后续的代码量，并不需要更改任何接口与数据，直接使用原有的接口进行测试

![](https://img.pincman.com/media/202309271314195.png)
