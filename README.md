## 学习目标
- 更换http驱动为fastify
- 控制器及其方法，请求对象及DTO
- 提供者概念，自定义提供者，异步提供者，循环依赖，注入范围
- 全局模块，动态模块，模块懒加载和模块参考

提前安装以下后
- lodash 一个通用的JS函数工具库
- class-validator 用于类的验证，本节主要结合DTO对请求数据进行验证
- class-transformer 序列化响应数据，本节用于结合class-validator进行序列化
- @nestjs/swagger nestjs的openapi支持库，本节只使用里面的`PartialType`函数
```typescript
~ pnpm add lodash class-validator class-transformer @nestjs/swagger
```
## 应用执行流程图
简单的nestjs应用的执行流程大概如下
> 三张图，选择其中一张看就可以

![[流程图.jpg]]
![[流程图 (1).jpg]]
![[20201109040813.png]]
## 更换http驱动
使用fastify代替默认的express，以提高应用的http响应速度，并把访问地址改成`0.0.0.0`以便外网访问
先安装fastify驱动
```shell
~ pnpm add @nestjs/platform-fastify
```
代码如下
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
    await app.listen(3000, '0.0.0.0');
}
```
## 控制器详解
### 控制器定义
使用`@Controller('路由路径')`来指定控制器
```typescript
// src/modules/forum/controllers/post.controller.ts
import { Controller } from '@nestjs/common';

@Controller('posts')
export class PostController {}
```
### 请求方法
控制器的请求方法如下

- `@Get`用于获取数据
- `@Post`用于新增数据
- `@Patch`用于更新部分数据
- `@Put`用于更新全部数据
- `@Delete`用于删除数据
- `@Options`用于对cors的跨域预检(一般用不到)
- `@Head`用于自定义请求头,常用于下载,导出excel文件等
### 请求对象
> 本节主要讲解`@Params`,`@Body`,其它的会在后面的学习中逐步讲解

可以通过以下装饰器获取需要的请求对象
`@Request(), @Req()`: 请求数据
`@Response(), @Res()`: 响应数据
`@Next()`: 执行下一个中间件(一般用不到)
`@Session()`: session对象(一般用不到)
```
@Param(key?: string)`:获取url中的params参数，比如 `posts/1
```
`@Body(key?: string)`:请求主体数据,一般结合DTO使用,用于新增或修改数据
```
@Query(key?: string)`:获取url中的查询数据，比如`posts?page=1
@HttpCode(statusCode: number)`:指定响应码，比如`@HttpCode(200)
@Redirect(url:string,statusCode:number)`:跳转到其它url，比如`@Redirect('/ccc',301)
```
示例
```typescript
// src/modules/forum/types.ts
export interface PostEntity {
    id: number;
    title: string;
    summary?: string;
    body: string;
}

// src/modules/forum/controllers/post.controller.ts
let posts: PostEntity[] = [
    { title: '第一篇文章标题', body: '第一篇文章内容' },
    { title: '第二篇文章标题', body: '第二篇文章内容' },
    { title: '第三篇文章标题', body: '第三篇文章内容' },
    { title: '第四篇文章标题', body: '第四篇文章内容' },
    { title: '第五篇文章标题', body: '第五篇文章内容' },
    { title: '第六篇文章标题', body: '第六篇文章内容' },
].map((v, id) => ({ ...v, id }));
@Controller('posts')
export class PostController {
    @Get()
    async index() {
        return posts;
    }

    @Get(':id')
    async show(@Param('id') id: number) {
        const post = posts.find((item) => item.id === Number(id));
        if (isNil(post))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        return post;
    }

    @Post()
    async store() {
        const newPost: PostEntity = {
            id: Math.max(...posts.map(({ id }) => id + 1)),
            title: '新增文章标题',
            body: '新增文章内容',
        };
        posts.push(newPost);
        return newPosts;
    }

    @Patch(':id')
    async update(@Param('id') id: number) {
        let toUpdate = posts.find((item) => item.id === Number(id));
        if (isNil(toUpdate))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        toUpdate = { ...toUpdate, title: '修改一篇文章的标题' };
        posts = posts.map((item) => (item.id === Number(id) ? toUpdate : item));
        return toUpdate;
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        const toDelete = posts.find((item) => item.id === Number(id));
        if (isNil(toDelete))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        posts = posts.filter((item) => item.id !== Number(id));
        return toDelete;
    }
}
```
### DTO与数据验证
dto是用于对请求数据结构进行定义的一个类，用于aop编程。常用于对`body`,`query`等请求数据进行验证
我们常用的验证库为`class-validator`
对于`body`和`query`数据的验证一般使用dto+`ValidationPipe`这个预定义管道(本节下面的内容会自定义一个全局管道代替这个预定义管道)
对于`param`数据的验证一般直接使用预定义或者自定义的非全局管道,比如`ParseUUIDPipe`
来自PartialType
示例
```typescript
// src/modules/forum/dtos/create-post.dto.ts
@Injectable()
export class CreatePostDto {
    @MaxLength(255, {
        always: true,
        message: '帖子标题长度最大为$constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: '帖子标题必须填写' })
    @IsOptional({ groups: ['update'] })
    title!: string;

    @IsNotEmpty({ groups: ['create'], message: '帖子内容必须填写' })
    @IsOptional({ groups: ['update'] })
    body!: string;

    @MaxLength(500, {
        always: true,
        message: '帖子描述长度最大为$constraint1',
    })
    @IsOptional({ always: true })
    summary?: string;
}
// src/modules/forum/dtos/update-post.dto.ts

import { CreatePostDto } from './create-post.dto';

@Injectable()
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsNumber(undefined, { groups: ['update'], message: '帖子ID格式错误' })
    @IsDefined({ groups: ['update'], message: '帖子ID必须指定' })
    id!: number;
}

// src/modules/forum/controllers/post.controller.ts
@Controller('posts')
export class PostController {
    @Get()
    async index() {
        return posts;
    }

    @Get(':id')
    async show(@Param('id', new ParseIntPipe()) id: number) {
        const post = posts.find((item) => item.id === id);
        if (isNil(post))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        return post;
    }

    @Post()
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        const newPost: PostEntity = {
            id: Math.max(...posts.map(({ id }) => id)),
            ...data,
        };
        posts.push(newPost);
        return newPost;
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        data: UpdatePostDto,
    ) {
        let toUpdate = posts.find((item) => item.id === data.id);
        if (isNil(toUpdate))
            throw new NotFoundException(
                `the post with id ${data.id} not exits!`,
            );
        toUpdate = { ...toUpdate, ...data };
        posts = posts.map((item) => (item.id === data.id ? toUpdate : item));
        return toUpdate;
    }

    @Delete(':id')
    async delete(@Param('id', new ParseIntPipe()) id: number) {
        const toDelete = posts.find((item) => item.id === id);
        if (isNil(toDelete))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        posts = posts.filter((item) => item.id !== id);
        return toDelete;
    }
}
```
## 提供者详解
通俗的来讲，提供者就是通过**类型提示**或者**标识符**的方式使某个类或函数以依赖注入的方式在其它需要使用到它的地方进行实例化
同时也是Nestjs，Laravel，Symfony以及Spring,Angular等现代web框架的核心所在
### 基本用法
在nestjs中如果要使一个类变成提供者，需要在其顶部添加`@Injectale()`装饰器
以一个服务类为例
```typescript
// src/modules/forum/services/post.service.ts
let posts: PostEntity[] = [
    { title: '第一篇文章标题', body: '第一篇文章内容' },
    { title: '第二篇文章标题', body: '第二篇文章内容' },
    { title: '第三篇文章标题', body: '第三篇文章内容' },
    { title: '第四篇文章标题', body: '第四篇文章内容' },
    { title: '第五篇文章标题', body: '第五篇文章内容' },
    { title: '第六篇文章标题', body: '第六篇文章内容' },
].map((v, id) => ({ ...v, id }));

@Injectable()
export class PostService {
    async findAll() {
        return posts;
    }

    async findOne(id: number) {
        const post = posts.find((item) => item.id === id);
        if (isNil(post))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        return post;
    }

    async create(data: CreatePostDto) {
        const newPost: PostEntity = {
            id: Math.max(...posts.map(({ id }) => id)),
            ...data,
        };
        posts.push(newPost);
        return newPost;
    }

    async update(data: UpdatePostDto) {
        let toUpdate = posts.find((item) => item.id === data.id);
        if (isNil(toUpdate))
            throw new NotFoundException(
                `the post with id ${data.id} not exits!`,
            );
        toUpdate = { ...toUpdate, ...data };
        posts = posts.map((item) => (item.id === data.id ? toUpdate : item));
        return toUpdate;
    }

    async delete(id: number) {
        const toDelete = posts.find((item) => item.id === id);
        if (isNil(toDelete))
            throw new NotFoundException(`the post with id ${id} not exits!`);
        posts = posts.filter((item) => item.id !== id);
        return toDelete;
    }
}

// src/modules/forum/controllers/post.controller.ts
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    @Get('common')
    async common() {
        return this.postService.getGlobalValue();
    }

    @Get('users')
    async users() {
        return this.postService.getPostUsers();
    }

    @Get()
    async index() {
        return this.postService.findAll();
    }

    @Get(':id')
    async show(@Param('id', new ParseIntPipe()) id: number) {
        return this.postService.findOne(id);
    }

    @Post()
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        return this.postService.create(data);
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        data: UpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseIntPipe()) id: number) {
        return this.postService.delete(id);
    }
}
```
### 注册与导出
提供者需要在模块元元素的`providers`中注册才可以被本模块的其它类注入，需要在`exports`中导出后才能被其它模块调用
```typescript
// src/modules/forum/forum.module.ts
@Module({
    // ...
    providers: [PostService],
    exports: [PostService],
})
export class ForumModule {}
```
### 自定义提供者
上面介绍的`PostService`是标准的提供者，下面来看一下各种各种样的提供者

- 值提供者: 使用`useValue`来构建一个提供者
- 字符串提供者: 使用字符串，比如`CONNECT`来构建一个提供者
- 类映射提供者: 使用一个类映射另一个类来构建一个提供者
- 构造器提供者: 使用`factory`来构建一个提供者
- 别名提供者: 使用`useExisting`来为一个提供者指定一个别名
- 异步提供者: 使用`async`关键字+`factory`构建异步提供者

示例
```typescript
// src/modules/forum/providers/example.provider.ts
@Injectable()
export class ExampleProvider {
    useValue() {
        return '';
    }

    useId() {
        return '字符串提供者';
    }

    useAlias() {
        return '别名提供者';
    }
}
// src/modules/forum/providers/another.provider.ts
@Injectable()
export class AnotherProvider {
    useClass() {
        return '';
    }
}
// src/modules/forum/providers/one.provider.ts
@Injectable()
export class OneProvider {
    useClass() {
        return '';
    }

    useFactory() {
        return '构造器提供者';
    }

    useAsync() {
        return '异步提供者';
    }
}
// src/modules/forum/providers/factory.ts
export class Factory {
    constructor(private one: OneProvider) {}

    getContent() {
        return this.one.useFactory();
    }

    async getPromise() {
        return new Promise((resovle) => {
            setTimeout(() => {
                resovle(this.one);
            }, 100);
        });
    }
}

// src/modules/forum/forum.module.ts
const exampleTest = {
    useValue: () => 'useValue提供者',
    useAlias: () => '别名提供者',
};
const example = new ExampleProvider();
@Module({
    controllers: [PostController, ExampleController],
    providers: [
        PostService,
        {
            provide: ExampleProvider,
            useValue: exampleTest,
        },
        {
            provide: 'ID-EXAMPLE',
            useValue: example,
        },
        {
            provide: OneProvider,
            useClass: AnotherProvider,
        },
        {
            provide: 'FACTORY-EXAMPLE',
            useFactory(one: OneProvider) {
                const factory = new Factory(one);
                return factory;
            },
            inject: [OneProvider],
        },
        {
            provide: 'ALIAS-EXAMPLE',
            useExisting: ExampleProvider,
        },
        {
            provide: 'ASYNC-EXAMPLE',
            useFactory: async () => {
                const factory = new Factory(new OneProvider());
                return factory.getPromise();
            },
        },
    ],
    exports: [PostService],
})
export class ForumModule {}

// src/modules/forum/controllers/example.controller.ts
@Controller('examples')
export class ExampleController {
    constructor(
        private valExp: ExampleProvider,
        @Inject('ID-EXAMPLE') private idExp: ExampleProvider,
        @Inject('FACTORY-EXAMPLE') private ftExp: Factory,
        @Inject('ALIAS-EXAMPLE') private asExp: ExampleProvider,
        @Inject('ASYNC-EXAMPLE') private acExp: OneProvider,
    ) {}

    @Get('value')
    async useValue() {
        return this.valExp.useValue();
    }

    @Get('id')
    async useId() {
        return this.idExp.useId();
    }

    @Get('factory')
    async useFactory() {
        return this.ftExp.getContent();
    }

    @Get('alias')
    async useAlias() {
        return this.asExp.useAlias();
    }

    @Get('async')
    async useAsync() {
        return this.acExp.useAsync();
    }
}
```
### 循环依赖
如果两个提供者之间互相依赖，可以通过注入`forwardRef`来实现
示例
```typescript
// src/modules/forum/providers/circular-first.provider.ts
@Injectable()
export class CircularFirstProvider {
    constructor(
        @Inject(forwardRef(() => CircularSecondProvider))
        protected second: CircularSecondProvider,
    ) {}

    first() {
        return `循环依赖1${this.second.second()}`;
    }
}
// src/modules/forum/providers/circular-second.provider.ts
@Injectable()
export class CircularSecondProvider {
    constructor(
        @Inject(forwardRef(() => CircularFirstProvider))
        protected first: CircularFirstProvider,
    ) {}

    second() {
        return `循环依赖2`;
    }
}

// src/modules/forum/controllers/example.controller.ts
@Controller('examples')
export class ExampleController {
    // ...
    @Get('circular')
    async useCircular() {
        return this.circular.first();
    }
}
```
同时模块间也可以循环依赖，例如
```typescript
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```
### 注入范围
在注入提供者时有多种方法
DEFAULT: 默认的单例注入，每次请求都是使用同一个实例
REQUEST: 每次请求创建一个新的提供者实例，并且该实例在这次请求内被所有调用者所共享，请求完毕自动销毁
TRANSIENT：每次被使用者注入该提供者时都会创建一个新的实例，换新的请求后就不变了
使用方法如下
```typescript
import { Injectable, Scope } from '@nestjs/common';
@Injectable({ scope: Scope.REQUEST })
export class CatsService {}

// or

{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```
## 模块详解
模块是一个功能的集合，比如`user`,`forum`等，包含了各自控制器，服务等等
### 共享模块
上面的forum如果要调用`user`模块的提供者，必须先在`user`中使用`exports`导出，然后在`forum`模块中使用`imports`导入
```typescript
// src/modules/user/services/user.service.ts
@Injectable()
export class UserService {
    async getUsers() {
        return ['pincman'];
    }
}
// src/modules/user/user.module.ts
@Module({
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}

// src/modules/forum/forum.module.ts
@Module({
    imports: [UserModule],
    // ...
})
export class ForumModule {}

// src/modules/forum/services/post.service.ts
@Injectable()
export class PostService {
    constructor(private userService: UserService) {}
    async getPostUsers() {
        return this.userService.getUsers();
    }
    // ...
}
// src/modules/forum/controllers/post.controller.ts
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    @Get('users')
    async users() {
        return this.postService.getPostUsers();
    }
}
```
### 全局模块
静态模块通过`@Global()`装饰器启用为全局模块，动态模块使用`isGlobal:true`启用全局模块
全局模块启用后，只要在中心模块`AppModule`导入，其它模块就能使用啦
```typescript
// src/modules/core/services/common.service.ts
@Injectable()
export class CommonService {
    getGlobalValue() {
        return '全局模块测试';
    }
}

// src/modules/core/services/common.service.ts
@Global()
@Module({
    providers: [CommonService],
    exports: [CommonService],
})
export class CoreModule {}
// src/app.module.ts
@Module({
    imports: [CoreModule, ForumModule, UserModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
```
### 动态模块
如果要在模块导入时传入参数，则需要定义动态模块
```typescript
// src/modules/core/services/common.service.ts
@Injectable()
export class CommonService {
    constructor(private options: { title: string }) {}

    getGlobalValue() {
        return this.options;
    }
}

// src/modules/core/core.module.ts
export class CoreModule {
    static forRoot(options: { title: string }): DynamicModule {
        return {
            module: CoreModule,
            global: true,
            providers: [
                {
                    provide: CommonService,
                    useFactory() {
                        const common = new CommonService(options);
                        return common;
                    },
                },
            ],
            exports: [CommonService]
        };
    }
}
// src/app.module.ts
@Module({
    imports: [
        CoreModule.forRoot({ title: '全局模块测试' }),
        ForumModule,
        UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
```
