自定义全局的验证管道，拦截器和过滤器
## 学习目标

- 编写一个自定义的全局验证管道，通过DTO可对请求数据进行自动化验证
- 编写一个自定义的全局拦截器，用于对响应数据自动进行序列化
- 编写一个自定义的过滤器，用于对不同的异常抛出自定义响应
## 文件结构
本节新增的代码主要集中于核心模块部分，代码结构如下
```shell
src/modules/core
├── constants.ts
├── decorators
│   ├── dto-validation.decorator.ts
│   └── index.ts
├── helpers
│   ├── index.ts
│   └── utils.ts
└── providers
    ├── app.filter.ts
    ├── app.interceptor.ts
    ├── app.pipe.ts
    └── index.ts
```
## 代码编写
### 验证管道
我们可以看到，前面我们每次需要对`Query`或者`Body`的请求数据进行格式验证时，每次都要在控制器的方法参数中对需要验证的参数的装饰器上实例化一下管道，这样代码显得非常冗余。
比如
```typescript
@Query(
    new ValidationPipe({
        transform: true,
        forbidUnknownValues: true,
        validationError: { target: false },
    }),
)
```
其实我们可以直接把这部分创建实例的代码给省略掉，而直接使用`ValidationPipe`作为全局管道来验证，这样的话就不需要在每个`Query`或者`Body`上编写这个代码了
比如
> `APP_PIPE`为nestjs框架的固定常量，用于设置全局管道

```typescript
// src/app.module.ts
@Module({
    imports: [DatabaseModule.forRoot(database), ContentModule],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        },
    ],
})
export class AppModule {}
```
但是这样做会有一些缺陷

1. 会导致无法自动区分`Body`还是`Query`，也就是在发送`body`数据的时候可能会去验证`query`
2. 在区分不同的验证组的时候我们需要传`groups`选项，或者有时候也可能传一些额外的其它选项，但是这样做之后我们就没办法再传其它验证选项了

为了解决以上两个问题，我们编写一个自定义的全局管道，然后在继承`ValidationPipe`的基础上重载`transform`方法，进行一些修改
具体步骤如下
一、定义一个常量用于定义DTO类上自定义验证选项的`metadata`数据
```typescript
// src/modules/core/constants.ts
/**
 * DTOValidation装饰器选项
 */
export const DTO_VALIDATION_OPTIONS = 'dto_validation_options';
```
二、定义一个装饰器用于存储DTO类上自定义验证选项的`metadata`数据到`DTO_VALIDATION_OPTIONS`
参数`options`的
```typescript
// src/modules/core/decorators/dto-validation.decorator.ts
/**
 * 用于配置通过全局验证管道验证数据的DTO类装饰器
 * @param options
 */
export const DtoValidation = (
    options?: ValidatorOptions & {
        transformOptions?: ClassTransformOptions;
    } & { type?: Paramtype },
) => SetMetadata(DTO_VALIDATION_OPTIONS, options ?? {});
```
三、编写管道逻辑
管道逻辑如下

1. 获取当前验证参数的DTO类(通过`design:paramtypes`获取参数值的类型)以及请求数据的类型
2. 通过`metadata`获取这个DTO类上的自定义验证选项(包含了序列化选项等，请看上述装饰器)
3. 把默认父类已经设置的验证选项给结构赋值给一个常量(防止覆盖下一次验证，因为全局管道是单例的提供者)
4. 把父类已经设置的默认序列化选项赋值给一个常量(与验证选项同理)
5. 把自定义选项给结构出来，获取自定义的序列化和验证选项，以及当前DTO类需要验证的请求数据类型(比如`body`,`query`等，具体查看`optionsType`类型)
6. 如果没有自定义设置待验证的请求数据类型，则默认为验证`body`数据
7. 如果请求数据的类型与当前DTO设置待验证的请求数据类型不一致(比如你发送的是`query`数据，但是待验证的是`body`)，则直接返回值而不进行验证，除非你有与该数据类型匹配的DTO。比如一个请求可能同时有`query`和`body`，则在验证`query`时跳过`body`，验证`body`时跳过`query`,互不影响
8. 使用`deepmerge`来深度合并自定义序列化选项以及父类自带的序列化选项获得最终的序列化选项
9. 同样地方法深度合并一下验证选项
10. 设置待验证的值（**这部分在文件上传章节再讲，此处不需要理解，此处直接使用**`**value**`**验证并不影响**）判断请求数据是否为一个对象，如果不是则其值本身就是就是待验证的值(比如只传入一个字符串)，如果请求数据是一个对象(包含数组)，则遍历其中的值，如果是一个文件上传类型的值或者一个对象，则去除这个值中的`fields`属性
11. 使用父类的`transform`方法进行验证并返回序列化后的值
12. 重置默认验证和序列化选项为前面我们通过常量存储的父类自带的选项
```typescript
// src/modules/core/providers/app.pipe.ts
@Injectable()
export class AppPipe extends ValidationPipe {
    async transform(value: any, metadata: ArgumentMetadata) {
        const { metatype, type } = metadata;
        // 获取要验证的dto类
        const dto = metatype as any;
        // 获取dto类的装饰器元数据中的自定义验证选项
        const options = Reflect.getMetadata(DTO_VALIDATION_OPTIONS, dto) || {};
        // 把当前已设置的选项解构到备份对象
        const originOptions = { ...this.validatorOptions };
        // 把当前已设置的class-transform选项解构到备份对象
        const originTransform = { ...this.transformOptions };
        // 把自定义的class-transform和type选项解构出来
        const { transformOptions, type: optionsType, ...customOptions } = options;
        // 根据DTO类上设置的type来设置当前的DTO请求类型,默认为'body'
        const requestType: Paramtype = optionsType ?? 'body';
        // 如果被验证的DTO设置的请求类型与被验证的数据的请求类型不是同一种类型则跳过此管道
        if (requestType !== type) return value;

        // 合并当前transform选项和自定义选项
        if (transformOptions) {
            this.transformOptions = merge(this.transformOptions, transformOptions ?? {}, {
                arrayMerge: (_d, s, _o) => s,
            });
        }
        // 合并当前验证选项和自定义选项
        this.validatorOptions = merge(this.validatorOptions, customOptions ?? {}, {
            arrayMerge: (_d, s, _o) => s,
        });
        const toValidate = isObject(value)
            ? Object.fromEntries(
                  Object.entries(value as Record<string, any>).map(([key, v]) => {
                      if (!isObject(v) || !('mimetype' in v)) return [key, v];
                      return [key, omit(v, ['fields'])];
                  }),
              )
            : value;
        // 序列化并验证dto对象
        let result = await super.transform(toValidate, metadata);
        // 重置验证选项
        this.validatorOptions = originOptions;
        // 重置transform选项
        this.transformOptions = originTransform;
        return result;
    }
}
```
接下来帮我们这个自定义的验证管道设置为全局验证管道
```typescript
// src/app.module.ts
@Module({
    imports: [DatabaseModule.forRoot(database), ContentModule],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new AppPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        },
    ],
})
export class AppModule {}
```
有了这个全局管道我们就可以把控制器中`@Body`,`@Query`中的验证管道删除掉了
```typescript
// src/modules/content/controllers/category.controller.ts
export class CategoryController {
    // ...
    @Get()
    @SerializeOptions({ groups: ['category-list'] })
    async list(
        @Query()
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    @Post()
    @SerializeOptions({ groups: ['category-detail'] })
    async store(
        @Body()
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @SerializeOptions({ groups: ['category-detail'] })
    async update(
        @Body()
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }
}
```
接下来还需要设置一下DTO类，给它们添加上`DtoValidation`装饰器并设置一下验证选项，例如
```typescript
// src/modules/content/dtos/category.dto.ts
@DtoValidation({ type: 'query' })
export class QueryCategoryDto implements PaginateOptions {
   // ...
}

/**
 * 分类新增验证
 */
@DtoValidation({ groups: ['create'] })
export class CreateCategoryDto {
    // ...
}

/**
 * 分类更新验证
 */
@DtoValidation({ groups: ['update'] })
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
   // ...
}
```
在处理完所有控制器和DTO类之后就能自动验证啦！
### 序列化拦截器
我们前面的课时中已经定义了一个序列化拦截器，然而每次要对一个控制器中的方法进行序列化的时候不是很方便，所以像全局验证管道一样把它也设置为全局就可以把控制器中的`@UseInterceptors(AppIntercepter)`去除掉
```typescript
// src/app.module.ts
@Module({
    imports: [DatabaseModule.forRoot(database), ContentModule],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new AppPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AppIntercepter,
        },
    ],
})
export class AppModule {}
```
然后我们可以去除掉每个控制器顶部的拦截器设置装饰器，因为自动会使用这个全局的拦截器对响应数据序列化处理，例如：
```typescript
// src/modules/content/controllers/post.controller.ts
// @UseInterceptors(AppIntercepter)
@Controller('posts')
export class PostController {
    // ...
}
```
### 异常过滤器
有时候我们需要自定义地对对一些应用异常进行处理，比如在Typeorm找不到数据时，默认Repository的`find`方法会抛出`EntityNotFoundError`这个异常，而这个异常不是nestjs的HTTP异常，这会导致我们的控制台出现`500`，而不会正常的响应给前端，如图
![](https://img.pincman.com/media/202301120309425.png#id=RCtT8&originHeight=1642&originWidth=2084&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
我们需要把它转换成`404`的`HttpNotFound`异常，这样就不会在控制台报错，而是正常响应给前端`404`了
![](https://img.pincman.com/media/202301120309845.png#id=w2pCF&originHeight=1888&originWidth=2942&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
要实现以上功能，我们需要定义一个全局的用于异常处理的过滤器
这个过滤器继承自nestjs的默认基础异常过滤器类，其逻辑如下

1. 定义一个用于映射异常处理表的属性`resExceptions`，在这个属性属性里，我们可以设置一些需要转换为HTTP的异常类，并且可以给他设置异常状态码（默认状态码是`500`）
2. 接下来判断当前抛出的异常对应的异常类是否在我们的映射表中，如果在我们把这个映射对象找出来。如果不在异常映射列表中而且也不是HTTP异常，则直接使用父类的`handleUnkownError`进行处理
3. 如果本身就是HTTP异常则直接使用父类的方式正常响应即可
4. 如果不是HTTP异常，那么就按映射的状态码来抛出HTTP异常
```typescript
// src/modules/core/providers/app.filter.ts
@Catch()
export class AppFilter<T = Error> extends BaseExceptionFilter<T> {
    protected resExceptions: Array<{ class: Type<Error>; status?: number } | Type<Error>> = [
        { class: EntityNotFoundError, status: HttpStatus.NOT_FOUND },
        { class: QueryFailedError, status: HttpStatus.BAD_REQUEST },
        { class: EntityPropertyNotFoundError, status: HttpStatus.BAD_REQUEST },
    ];

    // eslint-disable-next-line consistent-return
    catch(exception: T, host: ArgumentsHost) {
        const applicationRef =
            this.applicationRef || (this.httpAdapterHost && this.httpAdapterHost.httpAdapter)!;
        // 是否在自定义的异常处理类列表中
        const resException = this.resExceptions.find((item) =>
            'class' in item ? exception instanceof item.class : exception instanceof item,
        );

        // 如果不在自定义异常处理类列表也没有继承自HttpException
        if (!resException && !(exception instanceof HttpException)) {
            return this.handleUnknownError(exception, host, applicationRef);
        }
        let res: string | object = '';
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (exception instanceof HttpException) {
            res = exception.getResponse();
            status = exception.getStatus();
        } else if (resException) {
            // 如果在自定义异常处理类列表中
            const e = exception as unknown as Error;
            res = e.message;
            if ('class' in resException && resException.status) {
                status = resException.status;
            }
        }
        const message = isObject(res)
            ? res
            : {
                  statusCode: status,
                  message: res,
              };
        applicationRef!.reply(host.getArgByIndex(1), message, status);
    }
}
```
最后我们把这个过滤器设置成全局过滤器
```typescript
// src/app.module.ts
@Module({
    imports: [DatabaseModule.forRoot(database), ContentModule],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new AppPipe({
                transform: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AppIntercepter,
        },
        {
            provide: APP_FILTER,
            useClass: AppFilter,
        },
    ],
})
export class AppModule {}
```
本节课代码量不大，但是有些绕，希望大家多花些时间研究！
