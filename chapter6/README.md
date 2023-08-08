自定义数据验证约束及约束中的依赖注入
## 学习目标

- 编写自定义验证约束
- 编写可调用数据库的自定义验证约束
- 使验证约束可以注入nestjs容器的依赖
## 文件结构
这节课的内容主要是添加几个用于DTO类中的需要数据库验证的字段的约束
```shell
./src/modules/core/constraints
├── index.ts
├── match.constraint.ts
├── match.phone.constraint.ts
└── password.constraint.ts

./src/modules/database/constraints
├── index.ts
├── model.exist.constraint.ts
├── tree.unique.constraint.ts
├── tree.unique.exist.constraint.ts
├── unique.constraint.ts
└── unique.exist.constraint.ts
```
## 预装库
## 代码编写
这节课的代码非常简单。默认的class-validator常用的验证约束(即验证规则)，所以我们需要自定义一些约束来实现
验证约束分为两种

1. 直接通过验证类或函数进行验证，一般在不怎么使用装饰器风格的应用上，比如直接`new MatchConstraint()`
2. 通过装饰器进行验证，一般用在类似nestjs这种装饰器风格的应用上，比如`@IsMatch`

本节课讲解自定义装饰器风格的验证约束
### 普通约束
下面我们来编写一些常用的同步调用的简单验证规则，如密码验证等
#### 值相等验证[本节无使用]
有时候我们需要判断请求数据中的两个值是否相等，默认没有这个规则，所以我们如下编写

1.  `MatchConstraint`是一个验证类用于定义验证逻辑 
2.  该类必须实现`ValidatorConstraintInterface`接口 
3.  在该类的顶部加上`@ValidatorConstraint`装饰器，该装饰器的参数中必须传入`name`选项，可以随意定义 
4.  `validate`用于定义验证逻辑，`value`代表客户端传入的请求数据中当前验证属性的值，`args`有多个属性，可参考`ValidationArguments`类型，大致如下 
   - `value`: 与`value`参数同
   - `constraints`: 绑定该验证规则时转入的自定义参数数组
   - `targetName`: 被验证类的名称，比如`CreatePostDto`
   - `object`: 被验证类在绑定请求数据后的实例(通过对请求数据使用`plainToInstance`序列化构建)
   - `property`: 待验证属性的名称,比如`plainPassword`

该验证规则的逻辑为：获取传入的对比属性（数组结构后赋值给`relatedProperty`常量，比如`password`），通过`args.object`获取其值，然后与待验证的属性（比如`plainPassword`）的值进行对比判断是否相等，并返回结果 

5.  `defaultMessage`为验证失败是默认返回的错误消息，它也能获取到`args`参数，同时我们也可以在绑定验证规则时自定义错误消息，自定义的错误消息会覆盖`defaultMessage`的返回值 
6.  `IsMatch`是一个用于绑定验证属性，然后通过`MatchConstraint`类来进行验证的作为桥梁使用的装饰器工厂，它的参数可以随便自定义（此处我们只定义一个需要进行对比的关联属性名，比如`plainPassword`），但是最后一个参数必定是`ValidationOptions`类型的验证选项。它的返回值是一个装饰器函数，该函数只有两个固定参数，其中`object`参数为我们验证的DTO类，`propertyName`为我们验证的属性。该装饰器内部使用`registerDecorator`函数来注册验证约束。`registerDecorator`接收一个选项对象的参数，其传入的值如下 
   - `target`: 为待验证的DTO类的构造器，一般我们传入在工厂函数（即`IsMatch`）中传入的`object`参数的`object.contructor`
   - `propertyName`: 待验证属性的名称
   - `options`: 通过工厂函数传入的验证选项
   - `constraints`: 自定义参数数组，在这里有一个一个元素，就是在工厂函数传入的`relatedProperty`参数
   - `async`: 是否为异步验证约束（下文会讲到）
   - `validator`: 绑定的定义约束执行逻辑的类，此处为`MatchConstraint`（也可以是一个实现`ValidatorConstraintInterface`接口的普通对象）
7.  通过`registerDecorator`函数的设置后，`IsMatch`会自动把你传入的参数传入到`MatchConstraint`的构造函数并生成该类的用于验证DTO的属性 
```typescript
/**
 * 判断两个字段的值是否相等的验证规则
 */
@ValidatorConstraint({ name: 'isMatch' })
export class MatchConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [relatedProperty] = args.constraints;
        const relatedValue = (args.object as any)[relatedProperty];
        return value === relatedValue;
    }

    defaultMessage(args: ValidationArguments) {
        const [relatedProperty] = args.constraints;
        return `${relatedProperty} and ${args.property} don't match`;
    }
}

/**
 * 判断DTO中两个属性的值是否相等的验证规则
 * @param relatedProperty 用于对比的属性名称
 * @param validationOptions class-validator库的选项
 */
export function IsMatch(relatedProperty: string, validationOptions?: ValidationOptions) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [relatedProperty],
            validator: MatchConstraint,
        });
    };
}
```
使用方法如下
其中`message`中的`$constraint1`代表传入到`registerDecorator`函数中的`constraints`属性的第一个值，此处就是`plainPassword`
> 因为本节还没有用到，所以大家只要理解就行，后续讲解用户模块的时候才会用到这个约束，目前主要是学会自定义约束的写法

```typescript
    @Length(8, 50, {
        message: '密码长度不得少于$constraint1',
    })
    readonly password!: string;

    @IsMatch('password', { message: '两次输入密码不同' })
    @IsNotEmpty({ message: '请再次输入密码以确认' })
    readonly plainPassword!: string;
```
#### 密码匹配验证[本节无使用]
有时候我们每个应用的用户密码可能需要使用到不同的验证模式，所以我们统一写一个约束，预定义几种常用的密码验证模式，代码如下
> 验证约束写法不做重复性赘述

```typescript
/**
 * 密码验证规则
 */
@ValidatorConstraint({ name: 'isPassword', async: false })
export class IsPasswordConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        const validateModel: ModelType = args.constraints[0] ?? 1;
        switch (validateModel) {
            // 必须由大写或小写字母组成(默认模式)
            case 1:
                return /\d/.test(value) && /[a-zA-Z]/.test(value);
            // 必须由小写字母组成
            case 2:
                return /\d/.test(value) && /[a-z]/.test(value);
            // 必须由大写字母组成
            case 3:
                return /\d/.test(value) && /[A-Z]/.test(value);
            // 必须包含数字,小写字母,大写字母
            case 4:
                return /\d/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value);
            // 必须包含数字,小写字母,大写字母,特殊符号
            case 5:
                return (
                    /\d/.test(value) &&
                    /[a-z]/.test(value) &&
                    /[A-Z]/.test(value) &&
                    /[!@#$%^&]/.test(value)
                );
            default:
                return /\d/.test(value) && /[a-zA-Z]/.test(value);
        }
    }

    defaultMessage(_args: ValidationArguments) {
        return "($value) 's format error!";
    }
}

/**
 * 密码复杂度验证
 * 模式1: 必须由大写或小写字母组成(默认模式)
 * 模式2: 必须由小写字母组成
 * 模式3: 必须由大写字母组成
 * 模式4: 必须包含数字,小写字母,大写字母
 * 模式5: 必须包含数字,小写字母,大写字母,特殊符号
 * @param model 验证模式
 * @param validationOptions
 */
export function IsPassword(model?: ModelType, validationOptions?: ValidationOptions) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [model],
            validator: IsPasswordConstraint,
        });
    };
}
```
用法如下
```typescript
    @IsPassword(5, {
        message: '密码必须由小写字母,大写字母,数字以及特殊字符组成',
    })
    @Length(8, 50, {
        message: '密码长度不得少于$constraint1',
    })
    readonly password!: string;
```
#### 手机号验证[本节无使用]
对于手机号的格式，一般希望是`{区域码}.{号码}`，比如`+86.15111111111`。在编写手机号验证约束时，需要用到validator库（class-validator就是基于validator这个库编写的）中导出的`MobilePhoneLocale`来区域码类型，`IsMobilePhoneOptions`来设置严格模式
> `MobilePhoneLocale`默认是所有区域码都可以（除非你指定`IsMatchPhone`的第一个参数），`IsMobilePhoneOptions`默认为非严格模式，除非你指定`IsMatchPhone`的第二个参数

`IsMatchPhone`约束我们尝试使用简单的对象方式来代替验证类，其中`validator`属性设置的`validate`和`defaultMessage`接收的参数与验证类的参数是一样的
> 验证逻辑很简单，自己看代码，就不多讲了

```typescript
/**
 * 手机号验证规则,必须是"区域号.手机号"的形式
 */
export function isMatchPhone(
    value: any,
    locale?: MobilePhoneLocale,
    options?: IsMobilePhoneOptions,
): boolean {
    if (!value) return false;
    const phoneArr: string[] = value.split('.');
    if (phoneArr.length !== 2) return false;
    return isMobilePhone(phoneArr.join(''), locale, options);
}

/**
 * 手机号验证规则,必须是"区域号.手机号"的形式
 * @param locales 区域选项
 * @param options isMobilePhone约束选项
 * @param validationOptions class-validator库的选项
 */
export function IsMatchPhone(
    locales?: MobilePhoneLocale | MobilePhoneLocale[],
    options?: IsMobilePhoneOptions,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [locales || 'any', options],
            validator: {
                validate: (value: any, args: ValidationArguments): boolean =>
                    isMatchPhone(value, args.constraints[0], args.constraints[1]),
                defaultMessage: (_args: ValidationArguments) =>
                    '$property must be a phone number,eg: +86.12345678901',
            },
        });
    };
}
```
使用方法
```typescript
    @IsMatchPhone(
        undefined,
        { strictMode: true },
        {
            message: '手机格式错误,示例: +86.15005255555',
        },
    )
    phone: string;
```
### 异步验证
有时候我们需要用到数据库查询等异步操作来验证数据，这时我们需要指定异步选项，你可以在`registerDecorator`的选项参数中指定，但是一般我们会在验证类的`ValidatorConstraint`装饰器上指定，同时把`validate`方法变成异步方法
比如
```typescript
@ValidatorConstraint({ name: 'Test', async: true })
export class TestConstraint implements ValidatorConstraintInterface {

    async validate(value: string, args: ValidationArguments) {
      // ...
    }

    defaultMessage(args: ValidationArguments) {
       // ...
    }
}
```
#### 数据存在验证
前面我们在传入ID时（比如，过滤一个分类下的所有文章需要传入该分类的ID），只能验证这个ID格式是否符合uuid，而无法去验证该分类是否存在，这时候我们就可以自定义一个根据某个条件来判断数据是否存在的验证约束，其实现及逻辑如下

1.  定义一个`Condition`类型，用于设置查询条件参数，接收两个属性 
   1. `entity`: 用于设置查询的模型
   2. `map`: 用于设置需要查询的字段，默认为`id`
2.  因为需要使用到数据库查询，所以我们需要使用数据池，而DTO的验证规则是无法直接注入nestjs才可以拿到的typeorm数据连接池的，这时我们就需要把nestjs的容器加入到class-validator的`useContainer`中，以便class-validator的验证约束可以注入nestjs的提供者 
```typescript
async function bootstrap() {
    // ...
    useContainer(app.select(AppModule), {
        fallbackOnErrors: true,
    });
    await app.listen(3000);
}
```
 

3.  给验证类添加上`@Injectable()`装饰器以便能使其变成提供者，因为只有提供者才能注入提供者 
4.  编写验证逻辑，我们通过`this.dataSource.getRepository`获取该模型的默认Repository实例（因为这种数据查询非常简单，不需要专门传入我们自定义的Repository），然后使用Repository实例的`findOne`方法根据添加来进行数据查询，并返回是否存在的结果 
5.  大多数时候我们是通过`id`来查询该数据是否存的，比如我们请求数据中传入的`category`值为`xxx`，那么我们一般会使用这个`xxx`作为查询`CategoryEntity`的`id`来查询，所以`IsDataExist`一般传一个模型就行，这时候我们就需要设置一下重载这个函数，使它能接受不同的参数，也就是第一个条件参数既可以是一个Entity，这时候`map`就是`id`，也可以是一个完整的`Condition`类型的参数 
```typescript
import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource, ObjectType, Repository } from 'typeorm';

type Condition = {
    entity: ObjectType<any>;
    /**
     * 用于查询的比对字段,默认id
     */
    map?: string;
};
/**
 * 查询某个字段的值是否在数据表中存在
 */
@ValidatorConstraint({ name: 'dataExist', async: true })
@Injectable()
export class DataExistConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: string, args: ValidationArguments) {
        let repo: Repository<any>;
        if (!value) return true;
        // 默认对比字段是id
        let map = 'id';
        // 通过传入的entity获取其repository
        if ('entity' in args.constraints[0]) {
            map = args.constraints[0].map ?? 'id';
            repo = this.dataSource.getRepository(args.constraints[0].entity);
        } else {
            repo = this.dataSource.getRepository(args.constraints[0]);
        }
        // 通过查询记录是否存在进行验证
        const item = await repo.findOne({ where: { [map]: value } });
        return !!item;
    }

    defaultMessage(args: ValidationArguments) {
        if (!args.constraints[0]) {
            return 'Model not been specified!';
        }
        return `All instance of ${args.constraints[0].name} must been exists in databse!`;
    }
}

/**
 * 模型存在性验证
 * @param entity
 * @param validationOptions
 */
function IsDataExist(
    entity: ObjectType<any>,
    validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void;

/**
 *  模型存在性验证
 * @param condition
 * @param validationOptions
 */
function IsDataExist(
    condition: Condition,
    validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void;

/**
 * 模型存在性验证
 * @param condition
 * @param validationOptions
 */
function IsDataExist(
    condition: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [condition],
            validator: DataExistConstraint,
        });
    };
}

export { IsDataExist };
```
使用方法
```typescript
@DtoValidation({ groups: ['create'] })
export class CreateCategoryDto {
    // ...
    @IsDataExist(CategoryEntity, { always: true, message: '父分类不存在' })
    @IsUUID(undefined, { always: true, message: '父分类ID格式不正确' })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;
}

@DtoValidation({ type: 'query' })
export class QueryPostDto implements PaginateOptions {
    // ...
    @IsDataExist(CategoryEntity, {
        message: '指定的分类不存在',
    })
    @IsUUID(undefined, { message: '分类ID格式错误' })
    @IsOptional()
    category?: string;
}

@DtoValidation({ groups: ['create'] })
export class CreatePostDto {
    // ...
    @IsDateString({ strict: true }, { always: true })
    @IsOptional({ always: true })
    @ValidateIf((value) => !isNil(value.publishedAt))
    @Transform(({ value }) => (value === 'null' ? null : value))
    publishedAt?: Date;

    @IsDataExist(CategoryEntity, {
        each: true,
        always: true,
        message: '分类不存在',
    })
    @IsUUID(undefined, {
        each: true,
        always: true,
        message: '分类ID格式不正确',
    })
    @IsOptional({ always: true })
    categories?: string[];
}

@DtoValidation({ type: 'query' })
export class QueryCommentDto implements PaginateOptions {
    // ...
    @IsDataExist(PostEntity, {
        message: '所属的文章不存在',
    })
    @IsUUID(undefined, { message: '分类ID格式错误' })
    @IsOptional()
    post?: string;
}

@DtoValidation()
export class CreateCommentDto {
    // ...
    @IsDataExist(PostEntity, { message: '指定的文章不存在' })
    @IsUUID(undefined, { message: '文章ID格式错误' })
    @IsDefined({ message: '评论文章ID必须指定' })
    post!: string;

    @IsDataExist(CommentEntity, { message: '父评论不存在' })
    @IsUUID(undefined, { message: '父评论ID格式不正确' })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional()
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;
}
```
因为这个约束类中注入了nestjs的`dataSource`，但是只有提供者才能注入提供者，所以我们需要把它注册为`DatabaseModule`的提供者
```typescript
@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
            providers: [
                DataExistConstraint,
            ],
        };
    }
  // ...
}
```
#### 数据唯一性验证[本节无使用]
有时候我们需要一些字段是唯一性的，比如用户名，这时候我们仅在Entity中设置`unique`会导致数据库报错，而响应中拿不到任何数据，我们需要定义一个用于在请求时就可以验证的唯一性约束，这样就不需要等待真正插入数据的时候去报错
代码如下
> 由于代码逻辑比较简单，就不多赘述了

```typescript
type Condition = {
    entity: ObjectType<any>;
    /**
     * 如果没有指定字段则使用当前验证的属性作为查询依据
     */
    property?: string;
};

/**
 * 验证某个字段的唯一性
 */
@ValidatorConstraint({ name: 'dataUnique', async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        // 获取要验证的模型和字段
        const config: Omit<Condition, 'entity'> = {
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                  ...config,
                  entity: args.constraints[0],
              }) as unknown as Required<Condition>;
        if (!condition.entity) return false;
        try {
            // 查询是否存在数据,如果已经存在则验证失败
            const repo = this.dataSource.getRepository(condition.entity);
            return isNil(
                await repo.findOne({ where: { [condition.property]: value }, withDeleted: true }),
            );
        } catch (err) {
            // 如果数据库操作异常则验证失败
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        const { entity, property } = args.constraints[0];
        const queryProperty = property ?? args.property;
        if (!(args.object as any).getManager) {
            return 'getManager function not been found!';
        }
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique!`;
    }
}

/**
 * 数据唯一性验证
 * @param params Entity类或验证条件对象
 * @param validationOptions
 */
export function IsUnique(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueConstraint,
        });
    };
}
```
使用方法
```typescript
    @IsUnique(
        { entity: UserEntity },
        {
            groups: [UserDtoGroups.REGISTER, UserDtoGroups.CREATE],
            message: '该用户名已被注册',
        },
    )
    username!: string;
```
注册为提供者
```typescript
@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
            providers: [
                DataExistConstraint,
                UniqueConstraint,
            ],
        };
    }
  // ...
}
```
#### 忽略字段的唯一性验证[本节无使用]
在更新的时候，如果设置了某个字段的唯一性，但是该字段的值并没有改变，也会导致验证失败。比如在更新用户的`username`时，原来的`username`为`pincman`，这时，我们仍然传入`pincman`，那么在加上`@IsUnique`约束后会导致`pincman`这个用户名已存在的错误。不过更新数据时，我们都会传入这个需要更新的数据的ID，那么我们可以通过这个ID来忽略这条数据。
比如我们传入的更新数据是
```json
{
  "id": "xxx",
  "username": "pincman"
}
```
我们可以把ID为`xxx`这条数据给忽略掉，这时我们传入与原来用户名相同的用户名就不会报唯一性错误了，但是在传入其它已存在的用户名时仍然会正常的进行位移性验证
改约束的实现逻辑比较简单，代码中最重要的两点
> 这里的`withDeleted`暂时没用，后面一节我们讲到软删除时会起作用

-  `ignore`: 代表请求数据中用于查询时作为忽略依据的字段名，这个数据库字段必须与请求数据中的某个属性相同，默认为`id` 
-  查询数据时通过`repo.findOne`中的`where`里面传入`Not`来忽略字段 
```typescript
 await repo.findOne({
     where: {
         [condition.property]: value,
         [condition.ignore]: Not(ignoreValue),
     },
     withDeleted: true,
})
```
 整个约束的代码如下
```typescript
type Condition = {
    entity: ObjectType<any>;
    /**
     * 默认忽略字段为id
     */
    ignore?: string;
    /**
     * 如果没有指定字段则使用当前验证的属性作为查询依据
     */
    property?: string;
};

/**
 * 在更新时验证唯一性,通过指定ignore忽略忽略的字段
 */
@ValidatorConstraint({ name: 'dataUniqueExist', async: true })
@Injectable()
export class UniqueExistContraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        const config: Omit<Condition, 'entity'> = {
            ignore: 'id',
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                  ...config,
                  entity: args.constraints[0],
              }) as unknown as Required<Condition>;
        if (!condition.entity) return false;
        // 在传入的dto数据中获取需要忽略的字段的值
        const ignoreValue = (args.object as any)[condition.ignore];
        // 如果忽略字段不存在则验证失败
        if (ignoreValue === undefined) return false;
        // 通过entity获取repository
        const repo = this.dataSource.getRepository(condition.entity);
        // 查询忽略字段之外的数据是否对queryProperty的值唯一
        return isNil(
            await repo.findOne({
                where: {
                    [condition.property]: value,
                    [condition.ignore]: Not(ignoreValue),
                },
                withDeleted: true,
            }),
        );
    }

    defaultMessage(args: ValidationArguments) {
        const { entity, property } = args.constraints[0];
        const queryProperty = property ?? args.property;
        if (!(args.object as any).getManager) {
            return 'getManager function not been found!';
        }
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique!`;
    }
}

/**
 * 更新数据时的唯一性验证
 * @param params Entity类或验证条件对象
 * @param validationOptions
 */
export function IsUniqueExist(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueExistContraint,
        });
    };
}
```
使用方法
```typescript
    @IsUnique(
        { entity: UserEntity },
        {
            groups: [UserDtoGroups.REGISTER, UserDtoGroups.CREATE],
            message: '该用户名已被注册',
        },
    )
    @IsUniqueExist(
        { entity: UserEntity, ignore: 'id' },
        {
            groups: [UserDtoGroups.UPDATE, UserDtoGroups.BOUND],
            message: '该用户名已被注册',
        },
    )
    @Length(4, 30, {
        always: true,
        message: '用户名长度必须为$constraint1到$constraint2',
    })
    @IsOptional({ groups: [UserDtoGroups.UPDATE] })
    username!: string;
```
注册为提供者
```typescript
@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
            providers: [DataExistConstraint, UniqueConstraint, UniqueExistContraint],
        };
    }
  // ...
}
```
#### 树形结构同级别唯一性
在使用树形结构，比如树形分类时，我们可以有时会需要对同级别下的某个字段设置唯一性，例如
```typescript
[{
    name: "category1",
    children: [{
        name: "sub-category1",
    },{
        name: "sub-category2"
    }]
},{
  name: "category2"
}]
```
我们要在`category1`下再添加一个名称为`sub-category1`的子分类就会报唯一性错误，而在`category2`下添加一个`sub-category1`的子分类就不会报错，要实现这个功能，如果用模型去处理会比较麻烦，我们通过写个约束来处理就简单多了
> 具体逻辑请看代码以及注释

```typescript
type Condition = {
    entity: ObjectType<any>;
    parentKey?: string;
    property?: string;
};

/**
 * 验证树形模型下同父节点同级别某个字段的唯一性
 */
@Injectable()
@ValidatorConstraint({ name: 'treeDataUnique', async: true })
export class UniqueTreeConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        const config: Omit<Condition, 'entity'> = {
            parentKey: 'parent',
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                  ...config,
                  entity: args.constraints[0],
              }) as unknown as Required<Condition>;
        // 需要查询的属性名,默认为当前验证的属性
        const argsObj = args.object as any;
        if (!condition.entity) return false;

        try {
            // 获取repository
            const repo = this.dataSource.getTreeRepository(condition.entity);

            if (isNil(value)) return true;
            const collection = await repo.find({
                where: {
                    parent: !argsObj[condition.parentKey]
                        ? null
                        : { id: argsObj[condition.parentKey] },
                },
                withDeleted: true,
            });
            // 对比每个子分类的queryProperty值是否与当前验证的dto属性相同,如果有相同的则验证失败
            return collection.every((item) => item[condition.property] !== value);
        } catch (err) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        const { entity, property } = args.constraints[0];
        const queryProperty = property ?? args.property;
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique with siblings element!`;
    }
}

/**
 * 树形模型下同父节点同级别某个字段的唯一性验证
 * @param params
 * @param validationOptions
 */
export function IsTreeUnique(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueTreeConstraint,
        });
    };
}
```
使用方法
```typescript
@DtoValidation({ groups: ['create'] })
export class CreateCategoryDto {
    @IsTreeUnique(CategoryEntity, {
        groups: ['create'],
        message: '分类名称重复',
    })
    name!: string;
    // ...
}
```
注册为提供
```typescript
@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
            providers: [
                DataExistConstraint,
                UniqueConstraint,
                UniqueExistContraint,
                UniqueTreeConstraint,
            ],
        };
    }
  // ...
}
```
#### 忽略字段的树形结构同级别唯一性验证
这个与前面的`UniqueExistContraint`有异曲同工之处，就不多讲了直接上代码
```typescript
/**
 * 在更新时验证树形数据同父节点同级别某个字段的唯一性,通过ignore指定忽略的字段
 */
@Injectable()
@ValidatorConstraint({ name: 'treeDataUniqueExist', async: true })
export class UniqueTreeExistConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        const config: Omit<Condition, 'entity'> = {
            ignore: 'id',
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                  ...config,
                  entity: args.constraints[0],
              }) as unknown as Required<Condition>;
        if (!condition.findKey) {
            condition.findKey = condition.ignore;
        }
        if (!condition.entity) return false;
        // 在传入的dto数据中获取需要忽略的字段的值
        const ignoreValue = (args.object as any)[condition.ignore];
        // 查询条件字段的值
        const keyValue = (args.object as any)[condition.findKey];
        if (!ignoreValue || !keyValue) return false;
        const repo = this.dataSource.getTreeRepository(condition.entity);
        // 根据查询条件查询出当前验证的数据
        const item = await repo.findOne({
            where: { [condition.findKey]: keyValue },
            relations: ['parent'],
        });
        // 没有此数据则验证失败
        if (!item) return false;
        // 如果验证数据没有parent则把所有顶级分类作为验证数据否则就把同一个父分类下的子分类作为验证数据
        const rows: any[] = await repo.find({
            where: {
                parent: !item.parent ? null : { id: item.parent.id },
            },
            withDeleted: true,
        });
        // 在忽略本身数据后如果同级别其它数据与验证的queryProperty的值相同则验证失败
        return !rows.find(
            (row) => row[condition.property] === value && row[condition.ignore] !== ignoreValue,
        );
    }

    defaultMessage(args: ValidationArguments) {
        const { entity, property } = args.constraints[0];
        const queryProperty = property ?? args.property;
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique with siblings element!`;
    }
}

/**
 * 树形数据同父节点同级别某个字段的唯一性验证
 * @param params
 * @param validationOptions
 */
export function IsTreeUniqueExist(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueTreeExistConstraint,
        });
    };
}
```
使用方法
```typescript
@DtoValidation({ groups: ['create'] })
export class CreateCategoryDto {
    @IsTreeUnique(CategoryEntity, {
        groups: ['create'],
        message: '分类名称重复',
    })
    @IsTreeUniqueExist(CategoryEntity, {
        groups: ['update'],
        message: '分类名称重复',
    })
    name!: string;
   // ...
}
```
