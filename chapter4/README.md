数据关联与树形嵌套结构的分类和评论的实现
## 预准备
请在开始本课程之前务必通读[typeorm](https://typeorm.io)官方文档
## 学习目标

- 学会模型(数据表)之间的关联以及关联的CRUD操作
- 学会无限级树形嵌套模型的构建以及树形模型的CRUD操作
## 文件结构
因为前面很多节课都是讲内容模块，所以这些课大部分编码工作都是集中于内容模块的，本节课也是如此
在增加分类和评论后的文件结构如下
```shell
./src/modules/content
├── constants.ts
├── content.module.ts
├── controllers
│   ├── category.controller.ts
│   ├── comment.controller.ts
│   ├── index.ts
│   └── post.controller.ts
├── dtos
│   ├── category.dto.ts
│   ├── comment.dto.ts
│   ├── index.ts
│   └── post.dto.ts
├── entities
│   ├── category.entity.ts
│   ├── comment.entity.ts
│   ├── index.ts
│   └── post.entity.ts
├── repositories
│   ├── category.repository.ts
│   ├── comment.repository.ts
│   ├── index.ts
│   └── post.repository.ts
├── services
│   ├── category.service.ts
│   ├── comment.service.ts
│   ├── index.ts
│   ├── post.service.ts
│   └── sanitize.service.ts
└── subscribers
    ├── index.ts
    └── post.subscriber.ts
```
## 数据结构
我们可以先浏览一下我们的数据模型，了解每个表之间的关联关系
![](https://img.pincman.com/media/202301090136821.png#id=sRbHo&originHeight=902&originWidth=2382&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
通过上图可以知道，每个表之间的关系如下

- 分类与文章时多对多(many-to-many)的关系，这就意味着一个分类可以拥有多篇文章，一篇文章同时可以属于多个分类
- 文章与评论为一对多的关系(one-to-many)的关系，这就意味着一篇文章可以拥有多条评论，一个评论必定只属于一篇文章
## 代码编写
下面我们看下如果使用代码去实现
在编码流程上我们仍然遵循前面章节讲的流程，也就是从模型开始
### 模型
首先我们添加`CategoryEntity`来构建分类表，可以看到如下字段
```typescript
// src/modules/content/entities/category.entity.ts
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ comment: '分类名称' })
    name!: string;
  
    @Column({ comment: '分类排序', default: 0 })
    customOrder!: number;
}
```
下面我们来实现和文章的多对多关联关系
#### 关联实现
需要注意的是，正如typeorm官网文档里说的一样，在定义反向关系的时候我们需要遵循以下规则

- 多对多关联时，关联的一侧(比如这里的`PostEntity`的`categories`)必须加上`@JoinTable`装饰器
- 一对多关联时(反向关联为多对一)，两侧都不需要加任何东西
- 一对一关联时(本节课没用到)，关联的一侧必须要加上`@JoinColumn`装饰器
```typescript
// src/modules/content/entities/category.entity.ts
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    // ...
    @ManyToMany((type) => PostEntity, (post) => post.categories)
    posts!: PostEntity[];
}

// src/modules/content/entities/post.entity.ts
export class PostEntity extends BaseEntity {
    @ManyToMany(() => CategoryEntity, (category) => category.posts, {
        // 在新增文章时,如果所属分类不存在则直接创建
        cascade: true,
    })
    @JoinTable()
    categories!: CategoryEntity[];
}
```
#### cascade机制
可以看到我们在文章一侧的`@ManyToMany`的第三个选项参数中加入了`cascade`，这会在我们操作文章时可以触发一些额外的action
它可以是一个字符串数组，支持`("insert" | "update" | "remove" | "soft-remove" | "recover")[]`这些action，如果设置为`true`而不是一个字符串数组的话，那么默认包含全部action，这些所谓的action会出现如下作用，比如

- `insert` action会在你创建文章时，如果添加一些没有保存到数据库的分类模型对象，那么这些分类会自动在保存文章时被保存到数据库
- `update`action会在你更新文章时，同样的会把没有保存到数据库的分类，但添加到文章对象的分类给保存进数据库
- `remove`action一般用在一对一或者一对多关联，比如在你删除文章时同时删除文章下的评论
- `soft-remove`和`recover`是用于软删除和恢复的，这部分内容我们会留到后面的课时再讲

同时在`casecade`的另一侧，比如`CategoryEntity`的`posts`的上，或者`CommentEntity`的`post`上，他们的关联装饰器中可以设置`OnDelete`或者`OnUpdate`的操作以对应`casecade`，默认为`CASCADE`
比如我们在删除文章时，可以把评论一侧的`OnDelete`给设置为`CASCADE`，这样的话在删除文章时会自动删除它下面关联的所有评论，也可以设置成`SET NULL`(除非评论可以不属于一篇文章，也就是评论模型关联的文章字段可以是`null`)，这样的话会在删除文章时，评论不会被删除
#### 树形嵌套
什么是树形嵌套？
我们可以想象一下，比如在浏览一些商城网站时，他的分类可以有很多子分类，一个子分类下又会有很多子分类，这样可以无限级下去
比如如下结构
```shell
category1
    sub-category1
        sub-sub-category1
category2
    sub-category2
```
很多同学一开始可能会直接使用递归去实现这个，但是这样会非常影响程序的性能，而Typeorm默认是支持这种模型的，并且有四种方法去实现无限级嵌套
> 无限级嵌套模型的文档在[这里](https://typeorm.io/tree-entities)

但是经过站长对Typeorm长期使用之后发觉除了Materialized Path(物理路径)外的其它三种实现多多少少会有些坑，所以一般我们使用MP方式去实现，代码如下
```typescript
// src/modules/content/repositories/category.repository.ts
@Tree('materialized-path')
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    // ...
    depth = 0;
  
    @TreeParent({ onDelete: 'NO ACTION' })
    parent!: CategoryEntity | null;
  
    @TreeChildren({ cascade: true })
    children!: CategoryEntity[];
}
```
可以看到我们添加了

1. 在模型顶部添加`@Tree`装饰器，并且传入`materialized-path`，这就构建了一个MP的树形嵌套结构
2. 添加了`parent`和`children`字段，并为他们添加上`@TreeParent`和`@TreeChildren`装饰器，代表父分类和子分类
3. 因为顶级分类是没有父级分类的，所以它们的父分类是`null`，也就是我们的`parent`属性可以是`null`
4. 正如前面讲到的`cascade`，在我们的子分类上加上`cascade`为`true`，而在删除父分类时我们暂时不进行任何操作(因为我们需要在删除父分类时，子分类会提升一级，而不是直接被删除或者变成顶级分类，所以暂时不进行任何操作，这个功能我们在服务类中去实现)
5. 添加一个虚拟字段`depth`，我们在查询分类的分页数据时用来代表分类深度

接下来我们像上一节课一样，给模型做一下序列化配置。其中`category-tree`代表在直接查询这个分类树的时候显示的字段，而`category-list`代表在查询打平树并且分页后的数据时显示的字段
> 注意，对于类类型字段(比如关联的其他模型)的序列化，需要添加上`@Type`装饰器

```typescript
// src/modules/content/entities/category.entity.ts
@Exclude()
@Tree('materialized-path')
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Expose()
    @Column({ comment: '分类名称' })
    name!: string;

    @Expose({ groups: ['category-tree', 'category-list', 'category-detail'] })
    @Column({ comment: '分类排序', default: 0 })
    customOrder!: number;

    @Expose({ groups: ['category-list'] })
    depth = 0;

    @Expose({ groups: ['category-detail', 'category-list'] })
    @Type(() => CategoryEntity)
    @TreeParent({ onDelete: 'NO ACTION' })
    parent!: CategoryEntity | null;

    @Expose({ groups: ['category-tree'] })
    @Type(() => CategoryEntity)
    @TreeChildren({ cascade: true })
    children!: CategoryEntity[];

    @ManyToMany((type) => PostEntity, (post) => post.categories)
    posts!: PostEntity[];
}
```
同样的评论也是跟分类相似的，就不再赘述了，唯一的区别在于，我们删除评论时会通过`cascade`连带它的子评论一并删除
> `PostEntity`中的`commentCount`字段是一个动态生成的统计评论数量的虚拟字段

```typescript
// src/modules/content/entities/comment.entity.ts
@Exclude()
@Tree('materialized-path')
@Entity('content_comments')
export class CommentEntity extends BaseEntity {
    @Expose()
    @ManyToOne((type) => PostEntity, (post) => post.comments, {
        // 文章不能为空
        nullable: false,
        // 跟随父表删除与更新
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    post!: PostEntity;

    @TreeParent({ onDelete: 'CASCADE' })
    parent!: CommentEntity | null;

    ...
}

// src/modules/content/entities/post.entity.ts
@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity { 
    // ...
    @OneToMany((type) => CommentEntity, (comment) => comment.post, {
        cascade: true,
    })
    comments!: CommentEntity[];
  
   @Expose()
   commentCount!: number;
}
```
### 存储类
树形模型的自定义Repository需要继承`TreeRepository`，同时由于目前typeorm的`TreeRepository`中的所有查询方法均不支持传入自定义参数，所以我们可以重载其默认的方法来进行一些修改，这需要我们去查看这个基类的源代码，其源码在[这里](https://github.com/typeorm/typeorm/blob/master/src/repository/TreeRepository.ts)
#### 分类存储类

- 添加一个用于构建基础查询器的`buildBaseQB`,用于在查询分类时把它关联的父分类也顺带查询进去
- 重载`findRoots`,`createDescendantsQueryBuilder`以及`createAncestorsQueryBuilder`，这样就可以在查询顶级分类，子孙分类和祖先分类时，使用自定义的`customOrder`进行升序排序了
```typescript
// src/modules/content/repositories/category.repository.ts
@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    /**
     * 构建基础查询器
     */
    buildBaseQB() {
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
    }

    /**
     * 查询顶级分类
     * @param options
     */
    findRoots(options?: FindTreeOptions) {
        // ...
        const qb = this.buildBaseQB().orderBy('category.customOrder', 'ASC');
        // ...
    }

    /**
     * 创建后代查询器
     * @param alias
     * @param closureTableAlias
     * @param entity
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
     * @param alias
     * @param closureTableAlias
     * @param entity
     */
    createAncestorsQueryBuilder(alias: string, closureTableAlias: string, entity: CategoryEntity) {
        return super
            .createAncestorsQueryBuilder(alias, closureTableAlias, entity)
            .orderBy(`${alias}.customOrder`, 'ASC');
    }

    /**
     * 打平并展开树
     * @param trees
     * @param depth
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
```
因为分类是树形结构，没法使用`QueryBuilder`通过查询的方式直接进行分页，所以我们必须把所有的整棵树查出来，然后把它们进行扁平化处理，也就是“打平后”才能进行分页
比如把前面分类的结构变成这样
```typescript
category1
- sub-category1
-- sub-sub-category1
category2
- sub-category2
```
这时候我们首先要扁平化处理变成
```typescript
category1
sub-category1
sub-sub-category1
category2
sub-category2
```
同时要为代表分类的深度`depth`虚拟属性赋值，然后前端可以通过repeat几个(根据depth)`-`的方式来生成上面的结构，所以我们编写一个`toFlatTrees`方法，用于递归打平树，并且给每个分类赋值`depth`
#### 评论存储类
评论存储类与分类存储大同小异，一般情况下在后台管理评论时我们只需要查出所有的评论树然后打平分页就可以，但是在前台查看一篇文章的时候，这需要查看该篇文章下的评论，这时候我们需要加一个额外的查询，所以我们重载一些方法来添加一个额外的`addQuery`选项
```typescript
// src/modules/content/repositories/comment.repository.ts
type FindCommentTreeOptions = FindTreeOptions & {
    addQuery?: (query: SelectQueryBuilder<CommentEntity>) => SelectQueryBuilder<CommentEntity>;
};

@CustomRepository(CommentEntity)
export class CommentRepository extends TreeRepository<CommentEntity> {
    /**
     * 构建基础查询器
     */
    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return qb
            .leftJoinAndSelect(`comment.parent`, 'parent')
            .leftJoinAndSelect(`comment.post`, 'post')
            .orderBy('comment.createdAt', 'DESC');
    }

    /**
     * 查询树
     * @param options
     */
    async findTrees(options: FindCommentTreeOptions = {}) {
        options.relations = ['parent', 'children'];
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    /**
     * 查询顶级评论
     * @param options
     */
    findRoots(options: FindCommentTreeOptions = {}) {
        // ...
        let qb = this.buildBaseQB(this.createQueryBuilder('comment'));
        // ...
        qb = addQuery ? addQuery(qb) : qb;
        return qb.getMany();
    }

    /**
     * 创建后代查询器
     * @param closureTableAlias
     * @param entity
     * @param options
     */
    createDtsQueryBuilder(
        closureTableAlias: string,
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): SelectQueryBuilder<CommentEntity> {
        const { addQuery } = options;
        const qb = this.buildBaseQB(
            super.createDescendantsQueryBuilder('comment', closureTableAlias, entity),
        );
        return addQuery ? addQuery(qb) : qb;
    }

    /**
     * 查询后代树
     * @param entity
     * @param options
     */
    async findDescendantsTree(
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): Promise<CommentEntity> {
        const qb: SelectQueryBuilder<CommentEntity> = this.createDtsQueryBuilder(
            'treeClosure',
            entity,
            options,
        );
       // ...
    }

    async toFlatTrees(trees: CommentEntity[], depth = 0) {
        // ..
    }
}
```
#### 文章存储类
在查询文章时一般我们需要显示评论数量以及其关联的分类，所以需要修改`PostRepository`
评论数量是通过添加一个子查询把该篇文章关联的评论的数量先通过`select`查询出来，然后通过`loadRelationCountAndMap`映射到该篇文章的`commentCount`虚拟字段上
> 请注意`loadRelationCountAndMap`暂时Typeorm官方没有给出文档，需要通过`issue`才能找到该解决方案

```typescript
// src/modules/content/repositories/post.repository.ts
@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB() {
        // 在查询之前先查询出评论数量在添加到commentCount字段上
        return this.createQueryBuilder('post')
            .leftJoinAndSelect('post.categories', 'categories')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where('c.post.id = post.id');
            }, 'commentCount')
            .loadRelationCountAndMap('post.commentCount', 'post.comments');
    }
}
```
### DTO
#### 文章DTO
更改文章的几个DTO，使其能在查询时通过分类来过滤，并且在创建或更新文章时可以添加或修改关联的分类
> 分类是以ID的方式传进去的

```typescript
// src/modules/content/dtos/post.dto.ts
export class QueryPostDto implements PaginateOptions {
    @IsUUID(undefined, { message: '分类ID格式错误' })
    @IsOptional()
    category?: string;
}

export class CreatePostDto {
    @IsUUID(undefined, {
        each: true,
        always: true,
        message: '分类ID格式不正确',
    })
    @IsOptional({ always: true })
    categories?: string[];
}
```
同时添加一下分类和评论的DTO
> 由于评论没有更新这一功能，所以不需要UpdateDTO

#### 分类DTO
`@ValidateIf`是条件验证，在这里的作用是用于在添加或修改分类时，有指定父分类ID，且不为`null`时才进行验证
```typescript
// src/modules/content/dtos/category.dto.ts
export class QueryCategoryDto  implements PaginateOptions {
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit = 10;
}

/**
 * 分类新增验证
 */
export class CreateCategoryDto {
    @MaxLength(25, {
        always: true,
        message: '分类名称长度不得超过$constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: '分类名称不得为空' })
    @IsOptional({ groups: ['update'] })
    name!: string;

    @IsUUID(undefined, { always: true, message: '父分类ID格式不正确' })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;

    @Transform(({ value }) => toNumber(value))
    @Min(0, { always: true, message: '排序值必须大于0' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    customOrder = 0;
}

/**
 * 分类更新验证
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsUUID(undefined, { groups: ['update'], message: '分类ID格式错误' })
    @IsDefined({ groups: ['update'], message: '分类ID必须指定' })
    id!: string;
}
```
#### 评论DTO
`QueryCommentTreeDto`在于因为查询评论树不需要分页，所以传入文章ID就可以
```typescript
// src/modules/content/dtos/comment.dto.ts
/**
 * 评论分页查询验证
 */
export class QueryCommentDto  implements PaginateOptions {
    @IsUUID(undefined, { message: '分类ID格式错误' })
    @IsOptional()
    post?: string;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit = 10;
}

/**
 * 评论树查询
 */
export class QueryCommentTreeDto extends PickType(QueryCommentDto, ['post']) {}

/**
 * 评论添加验证
 */
export class CreateCommentDto {
    @MaxLength(1000, { message: '评论内容不能超过$constraint1个字' })
    @IsNotEmpty({ message: '评论内容不能为空' })
    body!: string;

    @IsUUID(undefined, { message: '文章ID格式错误' })
    @IsDefined({ message: '评论文章ID必须指定' })
    post!: string;

    @IsUUID(undefined, { always: true, message: '父评论ID格式不正确' })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;
}
```
### 服务类
在开始编写服务之前我们先编写一个用于树形结构查询的分页函数
> 因为树形结构需要查询出来后再分页，所以我们不需要传入queryBuilder

```typescript
// src/modules/database/helpers.ts
/**
 * 数据手动分页函数
 * @param options 分页选项
 * @param data 数据列表
 */
export function treePaginate<E extends ObjectLiteral>(
    options: PaginateOptions,
    data: E[],
): PaginateReturn<E> {
    const { page, limit } = options;
    let items: E[] = [];
    const totalItems = data.length;
    const totalRst = totalItems / limit;
    const totalPages =
        totalRst > Math.floor(totalRst) ? Math.floor(totalRst) + 1 : Math.floor(totalRst);
    let itemCount = 0;
    if (page <= totalPages) {
        itemCount = page === totalPages ? totalItems - (totalPages - 1) * limit : limit;
        const start = (page - 1) * limit;
        items = data.slice(start, start + itemCount);
    }
    return {
        meta: {
            itemCount,
            totalItems,
            perPage: limit,
            totalPages,
            currentPage: page,
        },
        items,
    };
}
```
#### 分类服务
分类服务几个方法如下代码

-  `findTrees`用于直接查询出整棵分类树 
-  `paginate`用于查询出分类数据打平后手动分页 
-  `detail`用于查询一个分类的信息详情 
-  `create`用于创建分类。创建分类时，父分类是无法直接作为一个ID保存的，所以其父分类的实例由`getParent`方法获取，设置父分类的逻辑如下 
   1. 当父分类为`undefined`时则不设置，可以看到模型类: 如果我们不设置的话，默认就是`null`(即顶级分类)
   2. 当父分类为`null`时也是顶级分类
   3. 当父分类为一个分类模型的实例时则设置父分类
-  `update`方法用于更新分类。 更新分类时，父分类同样是通过`getParent`获取，但是只有在这些情况下才会更新父分类 
> 注意`null`和`undefined`情况的区别:
> 只有父分类不为undefined的情况下才会更新(而父分类为`null`则代表该分类将成为顶级分类)

   1. 传入了父分类的ID且该父分类存在，并且该分类原本也有一个父分类，新的父分类和原本的父分类不是同一个分类
   2. 传入了父分类的ID且该父分类存在，但该类原本没有父分类(即顶级分类)的情况下
   3. 传入了父分类，但是ID为null，但是该分类原本有父分类的情况下(即把该分类提升为顶级分类)
-  `delete`为删除分类。删除一个分类前会先把它的子分类提升一级，这就与我们前面`CategoryEntity`这个模型中的`@TreeParent({ onDelete: 'NO ACTION' })`对应起来了 

`getParent`方法用于根据传入的当前分类的父分类ID以及即将更新的新父分类的ID来获取新父分类的实例
有两种场景

- 在创建分类时，当前分类还没有生成，所以其父分类为`undefined`，而新的父分类ID从请求数据中获取
- 在更新分类时，当前分类的父分类可能是`null`，也可能是一个分类，而新的父分类ID从请求数据中获取

获取父分类的逻辑如下

-  当前父分类和新父分类的ID如果相同(下面两种)的情况下，返回`undefined` 
   1. 在创建分类时没有传入父分类ID，则两者都是`undefined`
   2. 在更新分类时，如果有传入父分类ID(无论是`null`还是分类ID)且与原父分类的值相同
-  如果有传入父分类(也就是新父分类不是`undefined`)的情况下 
   1. 父分类的值为`null`，则返回`null`
   2. 如果有传入ID，则返回改ID对应的父分类模型实例
```typescript
// src/modules/content/services/category.service.ts
@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

    /**
     * 查询分类树
     */
    async findTrees() {
        return this.repository.findTrees();
    }

    /**
     * 获取分页数据
     * @param options 分页选项
     */
    async paginate(options: QueryCategoryDto) {
        const tree = await this.repository.findTrees();
        const data = await this.repository.toFlatTrees(tree);
        return treePaginate(options, data);
    }

    /**
     * 获取数据详情
     * @param id
     */
    async detail(id: string) {
        return this.repository.findOneByOrFail({ id });
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
        const parent = await this.getParent(data.id, data.parent);
        const querySet = omit(data, ['id', 'parent']);
        if (Object.keys(querySet).length > 0) {
            await this.repository.update(data.id, querySet);
        }
        const cat = await this.detail(data.id);
        const shouldUpdateParent =
            (!isNil(cat.parent) && !isNil(parent) && cat.parent.id !== parent.id) ||
            (isNil(cat.parent) && !isNil(parent)) ||
            (!isNil(cat.parent) && isNil(parent));
        // 父分类单独更新
        if (parent !== undefined && shouldUpdateParent) {
            cat.parent = parent;
            await this.repository.save(cat);
        }
        return cat;
    }

    /**
     * 删除分类
     * @param id
     */
    async delete(id: string) {
        const item = await this.repository.findOneOrFail({
            where: { id },
            relations: ['parent', 'children'],
        });
        // 把子分类提升一级
        if (!isNil(item.children) && item.children.length > 0) {
            const nchildren = [...item.children].map((c) => {
                c.parent = item.parent;
                return item;
            });

            await this.repository.save(nchildren);
        }
        return this.repository.remove(item);
    }

    /**
     * 获取请求传入的父分类
     * @param current 当前分类的ID
     * @param id
     */
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
```
#### 评论服务
评论除了没有更新和详情方法外与分类服务大同小异，说一下区别

- 在查询评论树，评论分页数据时，如果请求数据中有传入`post`的ID，则在使用`CommentRepository`的方法时，给这些方法添加一个`addQuery`选项，用于查询某篇文章下的评论
- 在创建评论时，如果设置了父评论，则该评论所属的文章ID必须与父评论的`post`ID相同，也就是它们必须在同一篇文章下，否则抛出异常
- 在删除评论时，直接删除其所有子孙评论（只要`CommentEntity`设置了`@TreeParent({ onDelete: 'CASCADE' })`就可以）而不需要做提升一级的处理
```typescript
// src/modules/content/services/comment.service.ts
@Injectable()
export class CommentService {
    constructor(
        protected repository: CommentRepository,
        protected postRepository: PostRepository,
    ) {}

    /**
     * 直接查询评论树
     * @param options
     */
    async findTrees(options: QueryCommentTreeDto = {}) {
        return this.repository.findTrees({
            addQuery: (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }

    /**
     * 查找一篇文章的评论并分页
     * @param dto
     */
    async paginate(dto: QueryCommentDto) {
        const { post, ...query } = dto;
        const addQuery = (qb: SelectQueryBuilder<CommentEntity>) => {
            const condition: Record<string, string> = {};
            if (!isNil(post)) condition.post = post;
            return Object.keys(condition).length > 0 ? qb.andWhere(condition) : qb;
        };
        const data = await this.repository.findRoots({
            addQuery,
        });
        let comments: CommentEntity[] = [];
        for (let i = 0; i < data.length; i++) {
            const c = data[i];
            comments.push(
                await this.repository.findDescendantsTree(c, {
                    addQuery,
                }),
            );
        }
        comments = await this.repository.toFlatTrees(comments);
        return treePaginate(query, comments);
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
     * 删除评论
     * @param id
     */
    async delete(id: string) {
        const comment = await this.repository.findOneOrFail({ where: { id: id ?? null } });
        return this.repository.remove(comment);
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
#### 文章服务
首先修改一下`PostOrderType`以便我们可以增加一个根据评论数量排序的功能
```typescript
// src/modules/content/constants.ts
/**
 * 文章排序类型
 */
export enum PostOrderType {
    CREATED = 'createdAt',
    UPDATED = 'updatedAt',
    PUBLISHED = 'publishedAt',
    COMMENTCOUNT = 'commentCount',
    CUSTOM = 'custom',
}
```
修改后的服务类代码如下

- 在创建新文章时，如果有传入的关联分类ID数组，则把这些关联分类给查询出来并给文章实例设置一下
- 在更新文章时，如果有传入的关联分了ID数组，则通过`addAndRemove`把原来关联的分类给删除掉并设置为新的关联分类列表
- 修改`buildListQuery`，在查询文章时，如果有传入分类ID，则通过`queryByCategory`过滤该分类**及其子孙分类**下的文章
- 最后修改`queryOrderBy`，添加上根据评论数量排序的规则
```typescript
// src/modules/content/services/post.service.ts
@Injectable()
export class PostService {
    constructor(
        protected repository: PostRepository,
        protected categoryRepository: CategoryRepository,
        protected categoryService: CategoryService,
    ) {}

    // ...

    /**
     * 创建文章
     * @param data
     */
    async create(data: CreatePostDto) {
        const createPostDto = {
            ...data,
            // 文章所属分类
            categories: isArray(data.categories)
                ? await this.categoryRepository.findBy({
                      id: In(data.categories),
                  })
                : [],
        };
        const item = await this.repository.save(createPostDto);

        return this.detail(item.id);
    }

    /**
     * 更新文章
     * @param data
     */
    async update(data: UpdatePostDto) {
        const post = await this.detail(data.id);
        if (isArray(data.categories)) {
            // 更新文章所属分类
            await this.repository
                .createQueryBuilder('post')
                .relation(PostEntity, 'categories')
                .of(post)
                .addAndRemove(data.categories, post.categories ?? []);
        }
        await this.repository.update(data.id, omit(data, ['id', 'categories']));
        return this.detail(data.id);
    }


    /**
     * 构建文章列表查询器
     * @param qb 初始查询构造器
     * @param options 排查分页选项后的查询选项
     * @param callback 添加额外的查询
     */
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        const { category, orderBy, isPublished } = options;
        let newQb = qb;
        if (typeof isPublished === 'boolean') {
            newQb = isPublished
                ? newQb.where({
                      publishedAt: Not(IsNull()),
                  })
                : newQb.where({
                      publishedAt: IsNull(),
                  });
        }
        newQb = this.queryOrderBy(newQb, orderBy);
        if (category) {
            newQb = await this.queryByCategory(category, newQb);
        }
        if (callback) return callback(newQb);
        return newQb;
    }

    /**
     *  对文章进行排序的Query构建
     * @param qb
     * @param orderBy 排序方式
     */
    protected queryOrderBy(qb: SelectQueryBuilder<PostEntity>, orderBy?: PostOrderType) {
        switch (orderBy) {
            case PostOrderType.CREATED:
                return qb.orderBy('post.createdAt', 'DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrderType.COMMENTCOUNT:
                return qb.orderBy('commentCount', 'DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC')
                    .addOrderBy('commentCount', 'DESC');
        }
    }

    /**
     * 查询出分类及其后代分类下的所有文章的Query构建
     * @param id
     * @param qb
     */
    protected async queryByCategory(id: string, qb: SelectQueryBuilder<PostEntity>) {
        const root = await this.categoryService.detail(id);
        const tree = await this.categoryRepository.findDescendantsTree(root);
        const flatDes = await this.categoryRepository.toFlatTrees(tree.children);
        const ids = [tree.id, ...flatDes.map((item) => item.id)];
        return qb.where('categories.id IN (:...ids)', {
            ids,
        });
    }
}
```
### 控制器
由于篇幅限制，控制器就不贴出代码了，纯粹就是调用服务，大家直接看代码即可，与`PostController`大同小异
### 模块类
最后请确认所有的模块文件都已在其同目录下的`index.ts`中导出，比如
```typescript
// src/modules/content/services/index.ts
export * from './sanitize.service';
export * from './category.service';
export * from './post.service';
export * from './comment.service';
```
然后修改`ContentModule`的`@Module`装饰器，通过`Object.values`来把这些类注册到它们的属性下
```typescript
// src/modules/content/content.module.ts
@Module({
    imports: [
        TypeOrmModule.forFeature(Object.values(entities)),
        DatabaseModule.forRepository(Object.values(repositories)),
    ],
    controllers: Object.values(controllers),
    providers: [...Object.values(services), PostSubscriber],
    exports: [
        ...Object.values(services),
        DatabaseModule.forRepository(Object.values(repositories)),
    ],
})
export class ContentModule {}
```
