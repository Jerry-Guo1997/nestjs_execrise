---
aliases: [2-请求数据的验证和响应数据的序列化]
tags: []
cssclass:
source:
date created: 星期四, 五月 25日 2023, 4:41:38 凌晨
date modified: 星期三, 六月 14日 2023, 8:39:08 晚上
---
## 学习目标
- 使用Fastify作为Nestjs的HTTP驱动
- DTO验证类的编写
- 数据序列化拦截器的使用
## 预准备
请在开始学习本节课之前务必查看class-validator和class-transformer的文档

- [我的网站翻译的文档(比较老)](https://pincman.com/class-validator-and-class-transformer-cn)
- 或自行谷歌搜索官网文档
## 依赖库

- class-validator 用于类的验证，本节主要结合DTO对请求数据进行验证
- class-transformer 序列化响应数据，本节用于结合class-validator进行序列化
- @nestjs/swagger是nestjs的openapi支持库，本节只使用里面的`PartialType`函数，因为Swagger是我们后续章节内容，本节并没有涉及

```shell
~ pnpm add class-validator class-transformer @nestjs/swagger
```

## 流程图
一般为了客户端对我们后端应用的操作所提交的请求数据能正确并且安全，需要对其进行数据验证。在Nestjs比较流行的验证方案是使用**class-validator+验证管道**。只有通过验证后的数据才能传递给控制器对数据进行操作。而在数据操作完毕返回给前端响应时，我们需要对数据进行序列化，以确保能规避一些不愿暴露的敏感数据或者在呈现列表时也出现大量关联和内容数据等以影响我们的应用性能，同时也可以使前端得到可读性更高的数据格式，nestjs中一般通过**class-transfomer(和class-validator同一个作者)+拦截器**来进行序列化.
Nestjs中的Restful API(Graphql则是另一套模型)从请求到数据验证，再到数据操作，最后到数据响应的大致流程如下
> 本节课还没有涉及到守卫，所以可以略过

![](https://img.pincman.com/media/202301070210197.jpg#id=LLrik&originHeight=1694&originWidth=1388&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
## 文件结构
本节课的修改集中在内容模块，其文件结构如下

```shell
./src/modules/content
├── constants.ts
├── content.module.ts
├── controllers
│   ├── index.ts
│   └── post.controller.ts
├── dtos
│   ├── index.ts
│   └── post.dto.ts
├── entities
│   ├── index.ts
│   └── post.entity.ts
├── repositories
│   ├── index.ts
│   └── post.repository.ts
├── services
│   ├── index.ts
│   ├── post.service.ts
│   └── sanitize.service.ts
└── subscribers
    ├── index.ts
    └── post.subscriber.ts
```

## 代码编写
### 数据验证
在上一节课的编码流程中有个DTO的环节我们略过了，这个DTO正是我们用来验证数据的类。我们分别为查询文章列表，创建文章和更新文章写一个对请求数据进行验证的DTO，其代码如下

```typescript
// src/modules/content/dtos/post.dto.ts
/**
 * 文章分页查询验证
 */
export class QueryPostDto implements PaginateOptions {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsEnum(PostOrderType, {
        message: `排序规则必须是${Object.values(PostOrderType).join(',')}其中一项`,
    })
    @IsOptional()
    orderBy?: PostOrderType;

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
 * 文章创建验证
 */
export class CreatePostDto {
    @MaxLength(255, {
        always: true,
        message: '文章标题长度最大为$constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: '文章标题必须填写' })
    @IsOptional({ groups: ['update'] })
    title!: string;

    @IsNotEmpty({ groups: ['create'], message: '文章内容必须填写' })
    @IsOptional({ groups: ['update'] })
    body!: string;

    @MaxLength(500, {
        always: true,
        message: '文章描述长度最大为$constraint1',
    })
    @IsOptional({ always: true })
    summary?: string;

    @IsDateString({ strict: true }, { always: true })
    @IsOptional({ always: true })
    @ValidateIf((value) => !isNil(value.publishedAt))
    @Transform(({ value }) => (value === 'null' ? null : value))
    publishedAt?: Date;

    @MaxLength(20, {
        each: true,
        always: true,
        message: '每个关键字长度最大为$constraint1',
    })
    @IsOptional({ always: true })
    keywords?: string[];

    @IsUUID(undefined, {
        each: true,
        always: true,
        message: '分类ID格式不正确',
    })
    @IsOptional({ always: true })
    categories?: string[];

    @Transform(({ value }) => toNumber(value))
    @Min(0, { always: true, message: '排序值必须大于0' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    customOrder = 0;
}

/**
 * 文章更新验证
 */
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsUUID(undefined, { groups: ['update'], message: '文章ID格式错误' })
    @IsDefined({ groups: ['update'], message: '文章ID必须指定' })
    id!: string;
}
```

可以看到上面的代码中我们定义一个类，在类中定义一些属性，这些属性正是我们用来对请求数据进行验证的，关于验证流程，本节课后面部分我们再详细讲，此处暂且不表，单讲里面的属性
我们首先分析一下`QueryPostDto`

- 在查询数据时，我们可以传入一个`isPublished`字段用于根据发布状态来查询文章,如果不传值也就是`undefined`的状态,则同时查询已发布和未发布的文章
- `orderBy`用来设置我们查询的排序,如果不传值就会使用综合排序方式
- `page`和`limit`用于分页设置,默认查询第一页并且每页显示`10`条数据

上面这些属性定义完毕之后如果没有添加我们的验证约束(通俗的讲就是验证规则)装饰器，那么是无效的。这些验证规则是通过`class-validator`导入的，每个验证规则的具体使用请参考class-validator的文档(或者我网站里的中文翻译文档)
在验证规则外，我们还对`isPublished`,`page`,`limit`字段进行了转译，因为大家要清楚的一点是，请求数据无论是`params`,`query`或者`body`，他们一定是个字符串类型，但是我们在使用判断是否查询发布状态，以及当前页面，每页数据量限制等字段的时候需要的是布尔值，整型等其它数据类型，这时候我们可以通过`class-transformer`导出的`Transform`装饰器来定义转译函数，在我们的`ValidationPipe`管道进行验证时，一旦有`Transform`装饰器，则会通过该装饰器自动先把该属性的值转译成需要的数据类型，然后再通过验证约束进行验证
下面的`CreatePostDto`的写法也是一样的，这里需要注意的是`UpdatePostDto`。因为class-validator的验证是可以通过选项来配置验证组的，所以我们的`UpdatePostDto`只要去继承`CreatePostDto`，就能继承其所有属性，那么在更新文章时，对于请求数据的验证，一些属性和它们的验证规则就不用重复写一个了，因为创建文章和更新文章的验证字段是一样的。
不过与创建文章不同的是在更新文章时，除了必须指定需要更新的文章的ID外，其它所有属性都是可选的，所以我们需要给`CreatePostDto`中的类似`title`,`body`的必须属性配置一下验证组，让它们只在创建时必须，而在更新时变成可选，类似这样
> 这里的`!`加不加无所谓

```typescript
@IsNotEmpty({ groups: ['create'], message: '文章标题必须填写' })
@IsOptional({ groups: ['update'] })
title!: string;
```

现在我们的验证类是正常的类，不过有时候我们通过在类型提示中使用这些DTO作为对象类型，这时候Update的DTO中的属性因为都是继承自CreateDTO，所以会出现一个情况，就是CreateDTO中的所有必须属性的类型，也会在UpdateDto的中变成必选，这虽然不会导致出现程序上的错误，但是会使我们的类型报错，所以我们让我们的UpdateDto不要直接继承CreateDTO，而是继承使用`@nestjs/swagger`导出的`PartialType`函数包装后的CreateDto，这样才不会引起UpdateDto作为类型提示的对象报类型错误。
类似下面那样

```typescript
export class UpdatePostDto extends PartialType(CreatePostDto)
```

### 修改控制器
有了DTO之后不代表就可以自动对请求数据进行验证了，我们需要把DTO作为类型提示添加到API端点(即控制器的方法)的参数上，然后再在`Query`,`Body`等装饰器上加上`ValidationPipe`管道才能对请求数据进行验证，如下面的代码

```typescript
@Controller('posts')
export class PostController {
    constructor(protected service: PostService) {}

    @Get()
    async list(
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true, 
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        )
        options: QueryPostDto,
    ) {
        return this.service.paginate(options);
    }

    @Post()
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true, 
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true, 
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        data: UpdatePostDto,
    ) {
        return this.service.update(data);
    }

    ...
}
```

我们在查询数据时会使用`query`，所以需要把验证管道加到`@Query`装饰器上，`query`的写法就是类似这样
`http://127.0.0.1:3000/posts/?page=1&&limit=10`
而我们在创建文章和更新文章时一般会用`body`数据，所以需要把验证管道加到`@Body`装饰器上,`body`数据的写法类似这样
`curl -X PATCH http://127.0.0.1:3000/posts -H "Content-Type: application/json" -d '{"id": "xxx-xx-xxxx-xxx-xxx", "time": "修改后的标题"}'`
在实例化`ValidationPipe`这个验证管道时，传入的参数的作用如下

- `transform`如果设置成`true`则代码在验证前先把请求数据转换为DTO的实例
- `whitelist`用于过滤掉没有添加验证的器的多余属性（但是如果该属性存在于DTO中且没有添加验证器，但又不想被过滤，你可以加上`@Allow`装饰器）
- `forbidNonWhitelisted`设置为`true`时，当请求中有DTO中不存在的多余属性被传入，则直接报错（前提是`whitelist`必须设置成`true`)
- `forbidUnknownValues`代表被验证的DTO类上必须至少有一个属性使用了`class-validator`中的验证规则（此选项是否设置无关紧要）
- `forbidUnknownValues`代表如果请求数据中有多余的数据(比如没有在验证管道中定义的属性)则会报出`403`错误
- `validationError.target`代表不会在响应数据中使我们的验证类也暴露传来
- `groups`用于设置验证组

`ValidationPipe`这个验证管道的流程如下:
一，在验证前先把自动把传入的请求数据先通过class-transformer导出的`plainToInstance`函数把普通对象的请求数据转换成通过验证数据类型提示的类的实例，比如`data: UpdatePostDto`，会是传入的`{"id": "xxx","title": "yyy"}`变成，这一步通过设置`transform`为`true`实现

```typescript
const data = new UpdatePostDto()
data.id = 'xxx'
data.title = 'yyy'
```

因为class-validator顾名思义，是对类的实例进行验证的，而无法验证普通对象，但是我们请求数据必定是个普通对象，所以第一步是管道必须做的
二，通过每个属性的验证约束对它们进行验证(如果有转译则转译之后对该属性进行验证)
三，验证失败则响应`403`给前端
四，那些加了`@Transform`装饰器的属性安装传入的序列化函数进行序列化
五，把对象转入到控制器，以便传给服务进行数据操作

### 序列化响应
为什么需要序列化数据？
主要作用在于避免一些敏感数据(比如后台管理员才能看到的字段)或者一些非常影响性能的数据(比如在读取文章列表时如果显示文章内容则会大大加重服务的负担以及API的性能，从而影响响应时间)在不需要的响应中显示
Nestjs中的响应数据序列化是通过拦截器结合class-transformer库去实现的，跟数据验证管道一样，其默认带有一个序列化拦截器，但是该拦截器并不支持对分页数据进行拦截，所以我们要继承下来更改一下，如下代码

```typescript
// src/modules/core/providers/app.interceptor.ts
export class AppIntercepter extends ClassSerializerInterceptor {
    serialize(
        response: PlainLiteralObject | Array<PlainLiteralObject>,
        options: ClassTransformOptions,
    ): PlainLiteralObject | PlainLiteralObject[] {
        if ((!isObject(response) && !isArray(response)) || response instanceof StreamableFile) {
            return response;
        }

        // 如果是响应数据是数组,则遍历对每一项进行序列化
        if (isArray(response)) {
            return (response as PlainLiteralObject[]).map((item) =>
                !isObject(item) ? item : this.transformToPlain(item, options),
            );
        }
        // 如果是分页数据,则对items中的每一项进行序列化
        if ('meta' in response && 'items' in response) {
            const items = !isNil(response.items) && isArray(response.items) ? response.items : [];
            return {
                ...response,
                items: (items as PlainLiteralObject[]).map((item) => {
                    return !isObject(item) ? item : this.transformToPlain(item, options);
                }),
            };
        }
        // 如果响应是个对象则直接序列化
        return this.transformToPlain(response, options);
    }
}
```

然后我们把该拦截器通过`@UseInterceptors`装饰器添加到控制器顶部，并且为每个方法配置序列化组
我们可以看到在创建，更新以及删除文章时我们使用`post-detail`组，而在查询文章列表时我们使用`post-list`组

```typescript
@UseInterceptors(AppIntercepter)
@Controller('posts')
export class PostController {
    constructor(protected service: PostService) {}

    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query(...)
        options: QueryPostDto,
    ) 

    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async detail(...)

    @Post()
    @SerializeOptions({ groups: ['post-detail'] })
    async store(
        @Body(...)
        data: CreatePostDto,
    )

    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body(...)
        data: UpdatePostDto,
    ) 

    @Delete(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async delete(@Param('id', new ParseUUIDPipe()) id: string)
}
```

接下来我们配置一下模型，让不同的数据在不同的组显示
> 所有序列化装饰器都是class-transfomer中导出的

- 通过`@Exclude`首先把所有属性都排除，然后根据我们的需要来配置我们的组
- 除了`body`外其它字段在所有的响应中都会显示
- `body`字段只在`post-detail`组的响应中显示，也就是在查询文章列表时我们不显示文章内容

```typescript
@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity {
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Expose()
    @Column({ comment: '文章标题' })
    title!: string;

    @Expose({ groups: ['post-detail'] })
    @Column({ comment: '文章内容', type: 'longtext' })
    body!: string;

    @Expose()
    @Column({ comment: '文章描述', nullable: true })
    summary?: string;

    @Expose()
    @Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Expose()
    @Column({
        comment: '文章类型',
        type: 'enum',
        enum: PostBodyType,
        default: PostBodyType.MD,
    })
    type!: PostBodyType;

    @Expose()
    @Column({
        comment: '发布时间',
        type: 'varchar',
        nullable: true,
    })
    publishedAt?: Date | null;

    @Expose()
    @Column({ comment: '自定义文章排序', default: 0 })
    customOrder!: number;

    @Expose()
    @Type(() => Date)
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt!: Date;

    @Expose()
    @Type(() => Date)
    @UpdateDateColumn({
        comment: '更新时间',
    })
    updatedAt!: Date;
}
```

可以看到，我们在查询文章列表时不显示文章内容
![](https://img.pincman.com/media/202301080421802.png#id=Wk9mt&originHeight=1888&originWidth=2942&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

而在查询文章详情时会显示文章内容

![](https://img.pincman.com/media/202301080422454.png#id=ikJ3T&originHeight=1888&originWidth=2942&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

这节课完毕！
