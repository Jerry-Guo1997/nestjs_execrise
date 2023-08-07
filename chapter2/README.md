---
aliases: [1-Nestjs整合Typeorm实现基本的CRUD操作及分页数据查询]
tags: []
cssclass:
source:
date created: 星期四, 五月 25日 2023, 4:40:55 凌晨
date modified: 星期五, 六月 9日 2023, 7:16:33 晚上
---
## 预准备
在学习本节课之前请一定要阅读完毕以下文档，文档中写详细的内容不会再课程里重复

- [Typescript装饰器详解](https://3rcd.com/wiki/decorator)
- [Typeorm官网文档](https://typeorm.io/)(中文正在翻译中，先看官方英文文档)
## 学习目标

- 使用Fastify驱动以提高应用响应速度
- 实现自定义Repoistory类
- 整合 Typeorm 与 Mysql 实现 Nestjs 对数据库的 CRUD 操作
- 实现数据分页查询
## Mysql的安装与配置
### 安装mysql数据库
> windows的话自己安装一个phpstudy就可以了，Linux可以使用`yay -Syy`等包管理工具安装或者直接下载二进制放到`/usr/local/mysql`里面(不建议使用编译安装)

> 会 docker，并喜欢使用 docker 作为自己学习环境的，也可以尝试使用 docker

```shell
~ brew update
~ brew install mysql
# 启动服务
~ brew services start mysql
# 重启服务
~ brew services restart mysql
```

### 执行初始化
> 密码建议`12345678`这种简单点的

```shell
~ mysql_secure_installation
```

### 尝试登录

```shell
~ mysql -u root -p #回车后输入你的密码
```

下载一个数据库管理工具，这里推荐使用**Navicat**(收费的)，建议可以去[这个网站](https://appstorrent.ru/)看看。下载后连接数据库，并新增一个库(比如`3r`)
![](https://img.pincman.com/media/202301062328538.png#id=kfMEE&originHeight=1888&originWidth=2942&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
## 依赖库

- lodash是常用的工具库
- typeorm一个TS编写的node.js ORM
- @nestjs/typeorm Nestjs的TypeOrm整合模块
- mysql2是Node的Mysql操作库
- [sanitize-html](https://github.com/apostrophecms/sanitize-html)过滤`html`标签,防注入攻击
- @nestjs/platform-fastify是Nestjs适配fastify框架的HTTP驱动

```bash
~ pnpm add lodash mysql2 typeorm @nestjs/typeorm sanitize-html @nestjs/platform-fastify
```

## 请求生命周期图

一个简单的数据库操作的Nestjs应用从请求到响应的流程图如下

![](https://img.pincman.com/media/202306141920318.png)

## 代码编写

首先建立两个模块目录，`src/modules/core`以及`src/modules/database`

### 更换http驱动

使用fastify代替默认的express，以提高应用的http响应速度。为了能使应用可以被不同网络的客户端访问，我们可以开启跨域。

> 不过后续会遇到很多坑，比如OAuth2登录,文件上传等，我们后续的课程会教大家如何一步步把fastify的坑给磨平

```typescript
async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );
    // 指定url前缀
    app.setGlobalPrefix('api');
    // 允许跨域
    app.enableCors();
    await app.listen(3000);
}
```

### 核心编码
> 这节课程`core`目录下并没有编写模块，而是存放一些公共类型和工具函数，这一节暂时用不到，不过先写几个工具函数也无妨

```typescript
// src/modules/core/helpers/utils.ts
/**
 * 用于请求验证中的boolean数据转义
 * @param value
 */
export function toBoolean(value?: string | boolean): boolean {
    if (isNil(value)) return false;
    if (typeof value === 'boolean') return value;
    try {
        return JSON.parse(value.toLowerCase());
    } catch (error) {
        return value as unknown as boolean;
    }
}

/**
 * 用于请求验证中转义null
 * @param value
 */
export function toNull(value?: string | null): string | null | undefined {
    return value === 'null' ? null : value;
}
```

在 index.ts 中导出 utils.ts里面的函数，因为目前我们使用的是 CommonJS 模式(nestjs目前不支持ESM)。所以后续直接可以使用导入`helpers`目录的方法来导入这些在子文件中导出的东西

```typescript
// src/modules/core/helpers/index.ts
export * from './utils';
```

### 数据库模块
本模块就是用来连接数据库以及编写一些数据库操作需要的东西
#### 数据库连接
首先我们写一些接口和类型，先不必去管他干嘛用的，后面会用到，看注释知道个大概

```typescript
// src/modules/database/types.ts

/**
 * 分页验证DTO接口
 */
export interface IPaginateDto<C extends IPaginationMeta = IPaginationMeta>
    extends Omit<IPaginationOptions<C>, 'page' | 'limit'> {
    page: number;
    limit: number;
}

/**
 * 为queryBuilder添加查询的回调函数接口
 */
export type QueryHook<Entity> = (
    qb: SelectQueryBuilder<Entity>,
) => Promise<SelectQueryBuilder<Entity>>;
```

接下来我们编写`DatabaseModule`模块，用来连接数据库
这里我们通过动态模块的方式来传入配置，可以看到我们使用了传入配置函数的方式而不是直接传入配置。这是因为直接传入静态配置会导致出现很多问题，比如后面的环境变量读取等，这对我们后续编写自己的配置系统这些课程会有一个理解上的帮助

```typescript
// src/modules/database/database.module.ts
import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { getDataSourceToken, TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, ObjectType } from 'typeorm';

@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
        };
    }
}
```

接下来我们编写一个配置文件，请注意

- 配置中必须设置`synchronize`为`true`，因为我们目前没有涉及到数据迁移的命令编写，所以必须在启动数据库时自动根据加载的模型(Entity)来同步数据表到数据库
- 配置中必须设置`autoLoadEntities`为`true`，这样我们就不需要把每个模块的`Entity`逐个定死地添加到配置中的`entities`数组中了，因为你可以在每个模块中使用`TypeOrmModule.forFeature`来动态的加入`Entity`

```typescript
// src/config/database.config.ts
/**
 * 数据库配置
 */
export const database = (): TypeOrmModuleOptions => ({
    charset: 'utf8mb4',
    logging: ['error'],
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: '12345678',
    database: '3r',
    synchronize: true,
    autoLoadEntities: true,
    // entities: []
});
```

然后我们在`AppModule`中通过`forRoot`传入配置并注册数据库模块即可，这样应用在启动时会根据模块(Entity)自动同步数据结构并连接数据库

```typescript
// src/app.module.ts
import { database } from './config';
@Module({
    imports: [DatabaseModule.forRoot(database)],
})
export class AppModule {}
```

#### 自定义Repository
因为我们使用的是**DataMapper**(类似symfony框架使用的Doctrine或者Java的Hibernate)与**ActiveRecord**(类似laravel的Eloquent或者ROR)混合的方式来编写数据操作。
Typeorm也支持两种方式随意切换，所以我们需要把Typeorm v0.3 以后版本取消掉的通过类自定义方法来自定义`Repository`的模式给复现出来，有了类我们才能把自定义的`Repository`注入到服务等其它地方进行数据操作
首先定义一个常量，用于存储自定义的Repository绑定的模型

```typescript
// src/modules/database/constants.ts

export const CUSTOM_REPOSITORY_METADATA = 'CUSTOM_REPOSITORY_METADATA';
```

在`DatabaseModule`中编写一个静态方法，用于把自定义的Repository类注册为提供者

- 这个静态函数将会接受一个自定义的Repository类列表以及数据库连接名称(我们目前只有一个连接,所以不需要传入,因为默认就连`default`)
- 遍历每个自定义的Repository类判断是否有通过`CUSTOM_REPOSITORY_METADATA`常量存储的模型，如果没有则忽略，因为这个类不是自定义Repository
- 如果有，那么首先我们获取数据库连接实例，然后注入到`useFactory`里面生成一个自定义的Repository实例并返回为提供者，其内部是先通过数据库连接实例(`dataSource`)生成这个模型的默认`Repsitory`实例，然后默认Repository的构造函数需要的参数通过默认的Repository实例获取，并传入到你自定义的Repository类的构造函数中以生成新的实例(自定义的Repository必须继承默认Repository，所以它们的构造函数参数是相同的)
- 最后把返回的所有自定义Repository类实例全部注册为`DatabaseModule`的提供者并通过`exports`导出

```typescript
// src/modules/database/database.module.ts

static forRepository<T extends Type<any>>(
        repositories: T[],
        dataSourceName?: string,
    ): DynamicModule {
        const providers: Provider[] = [];

        for (const Repo of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);

            if (!entity) {
                continue;
            }

            providers.push({
                inject: [getDataSourceToken(dataSourceName)],
                provide: Repo,
                useFactory: (dataSource: DataSource): InstanceType<typeof Repo> => {
                    const base = dataSource.getRepository<ObjectType<any>>(entity);
                    return new Repo(base.target, base.manager, base.queryRunner);
                },
            });
        }

        return {
            exports: providers,
            module: DatabaseModule,
            providers,
        };
    }
```

为了通过常量`CUSTOM_REPOSITORY_METADATA`来存储模型，我们还需要写一个装饰器来放置metadata

```typescript
// src/modules/database/decorators/repository.decorator.ts
export const CustomRepository = <T>(entity: ObjectType<T>): ClassDecorator =>
    SetMetadata(CUSTOM_REPOSITORY_METADATA, entity);
```

#### 分页函数
定义一个使用queryBuilder的分页函数，用于对文章进行分页
在此之前先定义该函数要用到的类型
> 直接查看注释即可明白

```typescript
// src/modules/database/types.ts
/**
 * 分页原数据
 */
export interface PaginateMeta {
    /**
     * 当前页项目数量
     */
    itemCount: number;
    /**
     * 项目总数量
     */
    totalItems?: number;
    /**
     * 每页显示数量
     */
    perPage: number;
    /**
     * 总页数
     */
    totalPages?: number;
    /**
     * 当前页数
     */
    currentPage: number;
}
/**
 * 分页选项
 */
export interface PaginateOptions {
    /**
     * 当前页数
     */
    page: number;
    /**
     * 每页显示数量
     */
    limit: number;
}

/**
 * 分页返回数据
 */
export interface PaginateReturn<E extends ObjectLiteral> {
    meta: PaginateMeta;
    items: E[];
}
```

函数实现如下:
因为`offset`+`limit`会出现一些问题(比如导致一些查找对象消失等)，所以我们使用`take`+`skip`来实现分页。关于`QueryBuilder`的使用请自行查看typeorm的官方文档，这里就不做过多赘述了

```typescript
// src/modules/database/helpers.ts
/**
 * 分页函数
 * @param qb queryBuilder实例
 * @param options 分页选项
 */
export const paginate = async <E extends ObjectLiteral>(
    qb: SelectQueryBuilder<E>,
    options: PaginateOptions,
): Promise<PaginateReturn<E>> => {
    const start = options.page > 0 ? options.page - 1 : 0;
    const totalItems = await qb.getCount();
    qb.take(options.limit).skip(start * options.limit);
    const items = await qb.getMany();
    const totalPages =
        totalItems % options.limit === 0
            ? Math.floor(totalItems / options.limit)
            : Math.floor(totalItems / options.limit) + 1;
    const remainder = totalItems % options.limit !== 0 ? totalItems % options.limit : options.limit;
    const itemCount = options.page < totalPages ? options.limit : remainder;
    return {
        items,
        meta: {
            totalItems,
            itemCount,
            perPage: options.limit,
            totalPages,
            currentPage: options.page,
        },
    };
};
```

### 内容模块
下面我们还是编写我们本节课的功能代码
编写流程如下
> 后续大多数数据操作模块的编码流程类似

1. 编写Entity模型
2. 编写Repository
3. 编写订阅者(如果有需要)
4. 编写DTO验证类(本节课没有涉及)
5. 编写服务类用于数据操作
6. 编写控制器
7. 在逻辑模块中注册提供者(包括服务类，订阅者等)以及控制器，Entity，Repository
8. 在`AppModule`中导入逻辑模块
#### 常量
在编写正式代码之前我们先添加几个常量

```typescript
// src/modules/content/constants.ts
 /**
 * 文章内容类型
 */
export enum PostBodyType {
    HTML = 'html',
    MD = 'markdown',
}

/**
 * 文章排序类型
 */
export enum PostOrderType {
    CREATED = 'createdAt',
    UPDATED = 'updatedAt',
    PUBLISHED = 'publishedAt',
    CUSTOM = 'custom',
}
```

#### 模型
TypeORM中模型就是所谓的Entity类，编写方法如下

- `@Entity`装饰器中的`'content_posts'`代表数据表的名称
- `@CreateDateColumn`与`@UpdateDateColumn`是由TypeORM自动维护的字段，用于数据创建和更新时间，我们后面讲到软删除还会使用到`@DeleteDateColumn`，这也是有TypeORM自动维护的
- 其它字段可以参考`comment`中的注释

```typescript
// src/modules/content/entities/post.entity.ts
@Entity('content_posts')
export class PostEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ comment: '文章标题' })
    title!: string;

    @Column({ comment: '文章内容', type: 'longtext' })
    body!: string;

    @Column({ comment: '文章描述', nullable: true })
    summary?: string;

    @Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Column({
        comment: '文章类型',
        type: 'enum',
        enum: PostBodyType,
        default: PostBodyType.MD,
    })
    type!: PostBodyType;

    @Column({
        comment: '发布时间',
        type: 'varchar',
        nullable: true,
    })
    publishedAt?: Date | null;

    @Column({ comment: '文章排序', default: 0 })
    customOrder!: number;

    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        comment: '更新时间',
    })
    updatedAt!: Date;
}
```

#### Repostitory
前面我们编写了自定义Repository的注册函数，下面我们就编写一个自定义的Repository

```typescript
// src/modules/content/repositories/post.repository.ts
@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('post');
    }
}
```

可以看到非常简单，我们的自定义Repository继承自默认的Repository，并为默认的Repository传入模型作为泛型，并且在顶部加上了前面编写的`CustomRepository`装饰器以存储`PostEntity`模型
同时我们添加了一个用户构建基础的查询器的`buildBaseQB`方法，此方法将会在后续课程发挥更大的作用
#### **防注入处理**
为了数据安全，我们编写一个额外的服务，使用[sanitize-html](https://github.com/apostrophecms/sanitize-html)对危险的html标签进行过滤，用来防止xss(跨站脚本)攻击

```typescript
 // src/modules/content/services/sanitize.service.ts
@Injectable()
export class SanitizeService {
    protected config: sanitizeHtml.IOptions = {};

    constructor() {
        this.config = {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'code']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                '*': ['class', 'style', 'height', 'width'],
            },
            parser: {
                lowerCaseTags: true,
            },
        };
    }

    sanitize(body: string, options?: sanitizeHtml.IOptions) {
        return sanitizeHtml(
            body,
            merge(this.config, options ?? {}, {
                arrayMerge: (_d, s, _o) => s,
            }),
        );
    }
}
```

#### 订阅者
订阅者的作用在于可以在CRUD(创建,查询,更新,删除)数据时创建一个钩子方法来执行额外的操作
比如这个`PostSubscriber`钩子可以让我们在查询文章时对HTML类型的文章内容进行防注入处理

```typescript
// src/modules/content/subscribers/post.subscriber.ts
@EventSubscriber()
export class PostSubscriber {
    constructor(
        protected dataSource: DataSource,
        protected sanitizeService: SanitizeService,
        protected postRepository: PostRepository,
    ) {}

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
```

#### 服务类
一般不会通过控制器来直接操作数据，而是通过服务来通过DataMapper或ActiveRecord模式对数据进行操作
可以看到我们前面定义的`IPaginateDto`接口在此处查询分页的方法中就可以作为类型提示了，另外通过`QueryHook`类型提示的`callback`回调函数参数还能用于添加自定义的`query`查询链，下面逐个分析一下

- `paginate`方法用于查询文章列表,并以分页的形式返回数据
- `detail`方法用于查询一篇文章的详情
- `create`,`update`,`delete`方法分别用于创建，更新和删除文章

这里我们重点来看一下`buildListQuery`这个非公开方法，此方法的作用在于

- 如果传入的`isPublished`值是一个布尔值(默认为`undefined`)则会根据是否为真来确定是否只查询发布或未发布的文章,默认查询所有文章
- 添加一个排序功能，可以根据自定义的`customOrder`字段排序，也可以根据文章的创建时间，更新时间或发布时间排序，默认为综合排序
- 同时如果有传入自定义的查询回调，还回执行以下查询回调返回一个新的查询器

```typescript
// src/modules/content/services/post.service.ts
@Injectable()
export class PostService {
    constructor(protected repository: PostRepository) {}

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: PaginateOptions, callback?: QueryHook<PostEntity>) {
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }

    /**
     * 查询单篇文章
     * @param id
     * @param callback 添加额外的查询
     */
    async detail(id: string, callback?: QueryHook<PostEntity>) {
         let qb = this.repository.buildBaseQB();
        qb.where(`post.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) throw new EntityNotFoundError(PostEntity, `The post ${id} not exists!`);
        return item;
    }

    /**
     * 创建文章
     * @param data
     */
    async create(data: Record<string, any>) {
        const item = await this.repository.save(data);

        return this.detail(item.id);
    }

    /**
     * 更新文章
     * @param data
     */
    async update(data: Record<string, any>) {
        await this.repository.update(data.id, omit(data, ['id']));
        return this.detail(data.id);
    }

    /**
     * 删除文章
     * @param id
     */
    async delete(id: string) {
        const item = await this.repository.findOneByOrFail({ id });
        return this.repository.remove(item);
    }

    /**
     * 构建文章列表查询器
     * @param qb 初始查询构造器
     * @param options 排查分页选项后的查询选项
     * @param callback 添加额外的查询
     */
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: Record<string, any>,
        callback?: QueryHook<PostEntity>,
    ) {
        const { orderBy, isPublished } = options;
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
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC');
        }
    }
}
```

#### 控制器
本节的控制器非常简单，只要注入服务类并调用里面的方法即可

```typescript
// src/modules/content/controllers/post.controller.ts	
@Controller('posts')
export class PostController {
    constructor(protected service: PostService) {}

    @Get()
    async list(
        @Query()
        options: PaginateOptions,
    ) {
        return this.service.paginate(options);
    }

    @Get(':id')
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    @Post()
    async store(
        @Body()
        data: Record<string, any>,
    ) {
        return this.service.create(data);
    }

    @Patch()
    async update(
        @Body()
        data: Record<string, any>,
    ) {
        return this.service.update(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }
}
```

#### 创建并模块

- 在`imports`通过`TypeOrmModule.forFeature`方法加载Entity，正如前面所配置的`synchronize`和`autoLoadEntities`属性预想的那样，这就可以生成并不断同步我们的数据表结构
- 在`imports`中使用我们前面定义的`forRepository`静态方法来注册我们自定义的Repository为提供者
- 把控制器放入`controllers`中
- 把`PostService`以及`PostSubscriber`注册成为提供者
- 最后在`exports`中导出`PostService`以及`DatabaseModule.forRepository([PostRepository])`(一定要包着模块导出，因为他是在`DatabaseModule`中注册的提供者)，以备其它模块导入使用

```typescript
// src/modules/content/content.module.ts
@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity]),
        DatabaseModule.forRepository([PostRepository]),
    ],
    controllers: [PostController],
    providers: [PostService, PostSubscriber],
    exports: [PostService, DatabaseModule.forRepository([PostRepository])],
})
export class ContentModule {}
```

最后把`ContentModule`导入到`AppModule`即可启动应用进行调试
## 调试应用
首先通过`pnpm start:dev`命令启动应用，然后把根目录下的`Insomnia.json`导入到`insomnia`中即可测试应用的接口，如图
![](https://img.pincman.com/media/202301070100472.png#id=E1C6S&originHeight=1886&originWidth=2942&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
