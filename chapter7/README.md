批量操作及软删除(回收站)功能使用
## 学习目标

- 实现数据的批量删除
- 实现数据的软删除，恢复及批量恢复(回收站功能)
## 代码结构
本节我们在模块目录中新增一个`restful`目录，用于存放一些公用的DTO等
> 后续课程会使用此目录用于编写restful模块

```shell
./src/modules/restful
└── dtos
    ├── delete-with-trash.dto.ts
    ├── delete.dto.ts
    ├── index.ts
    └── restore.dto.ts
```
## 代码编写
这一节的内容相对来说非常简单。因为一般情况下，评论删除后是不需要恢复的，所以没有用到回收站功能，所以我们先从评论功能的批量删除开始
### 批量删除
首先我们定义一个通用的用于验证批量删除请求数据的DTO，在请求时传入`ids`数组来指定需要删除的数据ID列表
```typescript
// src/modules/restful/dtos/delete.dto.ts
/**
 * 批量删除验证
 */
@DtoValidation()
export class DeleteDto {
    @IsUUID(undefined, {
        each: true,
        message: 'ID格式错误',
    })
    @IsDefined({
        each: true,
        message: 'ID必须指定',
    })
    ids: string[] = [];
}
```
接下来我们修改一下`CommentService`，把原来的单个删除转变为批量删除
```typescript
// src/modules/content/services/comment.service.ts
@Injectable()
export class CommentService {
  // ...
   /**
     * 删除评论
     * @param ids
     */
    async delete(ids: string[]) {
        const comments = await this.repository.find({ where: { id: In(ids) } });
        return this.repository.remove(comments);
    }
}
```
然后修改一下`CommentController`，使用签名定义的`DeleteDto`作为请求`body`数据的类型提示来接收批量删除请求，并且调用`CommentService`的`delete`方法进行批量删除
```typescript
// src/modules/content/controllers/comment.controller.ts
@Controller('comments')
export class CommentController {
  // ...
}
```
这样，一个简单的批量删除操作就完成啦！
### 软删除与数据恢复
软删除的意思就是在删除数据时不是把数据直接就从数据库中抹掉，而是通过一个字段暂时把他标记为**已删除状态**，然后再正常查询时忽略这些被标记的数据（除非你需要把这些已软删除的数据也查询出来）。这些被软删除的数据可以通过把**软删除标记字段设置为**`**null**`来恢复到正常状态，也可以在再一次删除时从数据库中清空掉
其思路与我们常见的操作系统的回收站功能（MacOS为废纸篓）功能类似，在删除文件到回收站后我们可以选择清空或者还原
接下来我们就来实现这个功能（以文章功能为例）
> 为了与批量删除对应，教程对软删除与恢复数据功能同样使用批量操作

首先修改一下`PostEntity`
为`PostEntity`添加一个`deletedAt`字段用于标识前面述说的软删除状态，当`deletedAt`为`null`时则数据处于正常状态，当`deletedAt`为一个时间时，则处于软删除状态（即处于回收站中），该字段由TypeORM自身通过`@DeleteDateColumn`装饰器进行维护，当使用Repository自带的`solfRemove`或者`restore`方法进行软删除或恢复数据时，它自己就会改变值，不需要手动设置
```typescript
// src/modules/content/entities/post.entity.ts
@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity {
  // ...
  @Expose()
  @Type(() => Date)
  @DeleteDateColumn({
      comment: '删除时间',
  })
  deletedAt: Date;
}
```
下面定义两个公共的DTO

- `DeleteWithTrashDto`继承自前面定义的`DeleteDto`，不过增加了一个属性`trash`的验证，用于在请求时判断本次批量删除操作是否为软删除操作
- `RestoreDto`用于批量恢复数据
```typescript
// src/modules/restful/dtos

/**
 * 带软删除的批量删除验证
 */
@DtoValidation()
export class DeleteWithTrashDto extends DeleteDto {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    trash?: boolean;
}

/**
 * 批量恢复验证
 */
@DtoValidation()
export class RestoreDto {
    @IsUUID(undefined, {
        each: true,
        message: 'ID格式错误',
    })
    @IsDefined({
        each: true,
        message: 'ID必须指定',
    })
    ids: string[] = [];
}
```
接着，添加一个常量用于在查询数据列表时定义软删除的状态

- `ALL`: 包含已软删除和未软删除的数据（同时查询正常数据和回收站中的数据）
- `ONLY`: 只包含软删除的数据 （只查询回收站中的数据）
- `NONE`: 只包含未软删除的数据 （只查询正常数据）
```typescript
// src/modules/database/constants.ts

/**
 * 软删除数据查询类型
 */
export enum SelectTrashMode {
    ALL = 'all', 
    ONLY = 'only', 
    NONE = 'none', 
}
```
然后修改一下`QueryPostDto`，增加一个`trashed`属性的验证，此属性的类型就是`SelectTrashMode`，用于在查询数据列表时设置待查询数据的状态
```typescript
// src/modules/content/dtos/post.dto.ts

/**
 * 文章分页查询验证
 */
@DtoValidation({ type: 'query' })
export class QueryPostDto implements PaginateOptions {
    @IsEnum(SelectTrashMode)
    @IsOptional()
    trashed?: SelectTrashMode;
}
```
接下来修改一下`PostService`

- 修改`buildListQuery`方法已实现在查询数据列表时根据请求数据的`trashed`类型判断对回收站中数据的查询方式
- 修改`delete`方法以支持批量删除数据，并且支持软删除功能
- 添加`restore`方法以对软删除后的数据进行批量恢复

注意: 在对已经软删除后的数据再次进行删除则直接把该数据真实删除（从数据库中删除）
```typescript
// src/modules/content/services/post.service.ts

@Injectable()
export class PostService {
    // ...
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        const { category, orderBy, isPublished, trashed = SelectTrashMode.NONE } = options;
        // 是否查询回收站
        if (trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY) {
            qb.withDeleted();
            if (trashed === SelectTrashMode.ONLY) qb.where(`post.deletedAt is not null`);
        }
        // ...
        return qb;
    }

    async delete(ids: string[], trash?: boolean) {
        const items = await this.repository.find({
            where: { id: In(ids) } as any,
            withDeleted: true,
        });
        if (trash) {
            // 对已软删除的数据再次删除时直接通过remove方法从数据库中清除
            const directs = items.filter((item) => !isNil(item.deletedAt));
            const softs = items.filter((item) => isNil(item.deletedAt));
            return [
                ...(await this.repository.remove(directs)),
                ...(await this.repository.softRemove(softs)),
            ];
        }
        return this.repository.remove(items);
    }

    /**
     * 恢复文章
     * @param ids
     */
    async restore(ids: string[]) {
        const items = await this.repository.find({
            where: { id: In(ids) } as any,
            withDeleted: true,
        });
        // 过滤掉不在回收站中的数据
        const trasheds = items.filter((item) => !isNil(item)).map((item) => item.id);
        if (trasheds.length < 0) return [];
        await this.repository.restore(trasheds);
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), {}, async (qbuilder) =>
            qbuilder.andWhereInIds(trasheds),
        );
        return qb.getMany();
    }
}
```
下面修改一下`PostController`
```typescript
// src/modules/content/controllers/post.controller.ts

@Controller('posts')
export class PostController {
    // ...
    @Delete()
    @SerializeOptions({ groups: ['post-list'] })
    async delete(
        @Body()
        data: DeleteWithTrashDto,
    ) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    @Patch('restore')
    @SerializeOptions({ groups: ['post-list'] })
    async restore(
        @Body()
        data: RestoreDto,
    ) {
        const { ids } = data;
        return this.service.restore(ids);
    }
}
```
这样我们就是实现文章的批量删除，软删除与批量恢复功能啦
### 树形结构的软删除与数据恢复
首先与文章模型一样，添加一个`deletedAt`字段
```typescript
// src/modules/content/entities/category.entity.ts

export class CategoryEntity extends BaseEntity {
    // ...
    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '删除时间',
    })
    deletedAt: Date;
}
```
与文章模型不同的时，分类模型是一个树形模型，它的数据查询是通过继承自`TreeRepository`的自定义Repository来实现的。但是`TreeRepository`默认的选项不足以实现太多的自定义查询，所以我们需要在自定义的`Repository`的一些重载查询方法中进行一些修改，使它们能根据更多的选项参数构建出更多查询方式的QueryBuilder，如下:

- 修改`findTrees`,`findRoots`,`findDescendants`,`findAncestors`,`countDescendants`以及`countAncestors`方法的选项参数类型，为其添加上`onlyTrashed`和`withTrashed`选项
- `withTrashed`为本次查询需要同时查询回收站中的数据，`onlyTrashed`为本次查询只查询回收站中的数据，只有当`withTrashed`为`true`时，`onlyTrashed`的值才会生效
```typescript
// src/modules/content/repositories/category.repository.ts

@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    // ...
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
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    /**
     * 查询后代元素
     * @param entity
     * @param options
     */
    findDescendants(
        entity: CategoryEntity,
        options?: FindTreeOptions & {
            onlyTrashed?: boolean;
            withTrashed?: boolean;
        },
    ) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy(`category.customOrder`, 'ASC');
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    /**
     * 查询祖先元素
     * @param entity
     * @param options
     */
    findAncestors(
        entity: CategoryEntity,
        options?: FindTreeOptions & {
            onlyTrashed?: boolean;
            withTrashed?: boolean;
        },
    ) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy(`category.customOrder`, 'ASC');
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    /**
     * 统计后代元素数量
     * @param entity
     * @param options
     */
    async countDescendants(
        entity: CategoryEntity,
        options?: { withTrashed?: boolean; onlyTrashed?: boolean },
    ) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    /**
     * 统计祖先元素数量
     * @param entity
     * @param options
     */
    async countAncestors(
        entity: CategoryEntity,
        options?: { withTrashed?: boolean; onlyTrashed?: boolean },
    ) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }
}
```
更改DTO
先添加一个`QueryCategoryTreeDto`，用于对分类书查询时设置软删除状态。同时修改`QueryCategoryDto`使其继承`QueryCategoryTreeDto`
```typescript
// src/modules/content/dtos/category.dto.ts

/**
 * 树形分类查询验证
 */
@DtoValidation({ type: 'query' })
export class QueryCategoryTreeDto {
    @IsEnum(SelectTrashMode)
    @IsOptional()
    trashed?: SelectTrashMode;
}

/**
 * 分类分页查询验证
 */
@DtoValidation({ type: 'query' })
export class QueryCategoryDto extends QueryCategoryTreeDto implements PaginateOptions {
}
```
修改`CategoryService`

- 修改`findTrees`以及`paginate`，使其可以根据软删除模式来查询数据
- 修改`delete`方法，使其支持软删除和批量删除（与`PostService`同理，不再赘述）
- 添加`restore`方法，使其支持数据恢复（与`PostService`同理，不再赘述）
```typescript
// src/modules/content/services/category.service.ts

/**
 * 分类数据操作
 */
@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

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
        return manualPaginate(options, data);
    }
  
     /**
     *  删除分类
     * @param ids
     * @param trash
     */
    async delete(ids: string[], trash?: boolean) {
        const items = await this.repository.find({
            where: { id: In(ids) },
            withDeleted: true,
            relations: ['parent', 'children'],
        });
        for (const item of items) {
            // 把子分类提升一级
            if (!isNil(item.children) && item.children.length > 0) {
                const nchildren = [...item.children].map((c) => {
                    c.parent = item.parent;
                    return item;
                });

                await this.repository.save(nchildren);
            }
        }
        if (trash) {
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
最后修改`CategoryController`，与`PostController`类似，添加上批量删除，软删除和恢复数据的操作。
同时我们需要给树形结构的查询添加一个`options`，这样在树形结构中也能根据软删除模式查询数据了~
```typescript
// src/modules/content/controllers/category.controller.ts

@Controller('categories')
export class CategoryController {
    // ...

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    async tree(@Query() options: QueryCategoryTreeDto) {
        return this.service.findTrees(options);
    }

    @Delete()
    @SerializeOptions({ groups: ['category-list'] })
    async delete(
        @Body()
        data: DeleteWithTrashDto,
    ) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    @Patch('restore')
    @SerializeOptions({ groups: ['category-list'] })
    async restore(
        @Body()
        data: RestoreDto,
    ) {
        const { ids } = data;
        return this.service.restore(ids);
    }
}
```
到此为止，我们这一节的功能就已全部完成了！请导入本节的新的`Insomnia.json`文件来进行测试哦！
