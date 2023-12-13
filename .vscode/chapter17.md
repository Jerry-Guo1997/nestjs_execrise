---
title: 数据迁移命令实现
sidebar_label: 数据迁移命令实现
hide_title: true
sidebar_position: 17
---

:::note
本文档文字解释部分更新中,当前为代码实现步骤版本
:::

## 预准备

## 预装库

```bash
pnpm add @faker-js/faker dayjs
```

## 功能实现

### 核心模块

#### 应用常量

```typescript
// app实例常量
export const app: App = { configure: new Configure(), commands: [] };

export const createApp = (options: CreateOptions) => async (): Promise<App> => {
    const { config, builder } = options;
    // 初始化配置实例
    await app.configure.initilize(config.factories, config.storage);
    ...
    app.commands = await createCommands(options.commands, app as Required<App>);
    return app;
};

export async function startApp(
    creator: () => Promise<App>,
    listened?: (app: App, startTime: Date) => () => Promise<void>,
) {
    const startTime = new Date();
    const { container, configure, commands } = await creator();
    app.commands = commands;
    app.container = container;
    app.configure = configure;
    const { port, host } = await configure.get<AppConfig>('app');
    await container.listen(port, host, listened(app, startTime));
}
```

#### 类型

```typescript
/**
 * 应用配置
 */
export interface AppConfig {
    ...
    /**
     * 时区,默认Asia/Shanghai
     */
    timezone: string;
    /**
     * 语言,默认zh-cn
     */
    locale: string;
    /**
     * 备用语言
     */
    fallback_locale: string;
}
```

#### 默认配置

```typescript
export const getDefaultAppConfig = (configure: Configure) => ({
    ...
    locale: configure.env.get('APP_LOCALE', 'zh_CN'),
    fallbackLocale: configure.env.get('APP_FALLBACK_LOCALE', 'en'),
});
```

#### 时间函数

```typescript
/**
 * getTime函数获取时间的选项参数
 */
export interface TimeOptions {
    /**
     * 时间
     */
    date?: dayjs.ConfigType;
    /**
     * 输出格式
     */
    format?: dayjs.OptionType;
    /**
     * 语言
     */
    locale?: string;
    /**
     * 是否严格模式
     */
    strict?: boolean;
    /**
     * 时区
     */
    zonetime?: string;
}


import dayjs from 'dayjs';

import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import localeData from 'dayjs/plugin/localeData';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import deepmerge from 'deepmerge';
import { isNil } from 'lodash';

import { PanicOption } from '../types';

dayjs.extend(localeData);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(dayOfYear);

/**
 * 获取一个dayjs时间对象
 * @param configure
 * @param options
 */
export const getTime = async (configure: Configure, options?: TimeOptions) => {
    const { date, format, locale, strict, zonetime } = options ?? {};
    const config = await configure.get<AppConfig>('app');
    // 每次创建一个新的时间对象
    // 如果没有传入local或timezone则使用应用配置
    const now = dayjs(date, format, locale ?? config.locale, strict).clone();
    return now.tz(zonetime ?? config.timezone);
};
```

### 订阅者

#### 文章订阅类

```typescript
@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity = PostEntity;

    constructor(
        protected configure: Configure,
        @Optional() protected dataSource?: DataSource,
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
        if (isNil(this.sanitizeService)) {
            this.sanitizeService = app.container.get(SanitizeService, { strict: false });
        }
        if (
            (await this.configure.get('content.htmlEnabled')) &&
            !isNil(this.sanitizeService) &&
            entity.type === PostBodyType.HTML
        ) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
```

#### 添加函数

```typescript
/**
 * 在模块上注册订阅者
 * @param configure 配置类实例
 * @param subscribers 订阅者列表
 * @param dataSource 数据库连接名称
 */
export const addSubscribers = async (
    configure: Configure,
    subscribers: Type<any>[] = [],
    dataSource = 'default',
) => {
    const database = await configure.get<DbConfig>('database');
    if (isNil(database)) throw new Error(`Typeorm have not any config!`);
    const dbConfig = database.connections.find(({ name }) => name === dataSource);
    // eslint-disable-next-line prettier/prettier, prefer-template
    if (isNil(dbConfig)) throw new Error('Database connection named' + dataSource + 'not exists!');

    const oldSubscribers = (dbConfig.subscribers ?? []) as any[];

    /**
     * 更新数据库配置,添加上新的订阅者
     */
    configure.set(
        'database.connections',
        database.connections.map((connection) =>
            connection.name === dataSource
                ? {
                      ...connection,
                      subscribers: [...oldSubscribers, ...subscribers],
                  }
                : connection,
        ),
    );
    return subscribers;
};
```

### 数据库模块

#### 类型

```typescript
/**
 * 额外数据库选项,用于CLI工具
 */
type DbAdditionalOption = {
    /**
     * 填充类
     */
    seedRunner?: SeederConstructor;
    /**
     * 填充类列表
     */
    seeders?: SeederConstructor[];

    /**
     * 数据构建函数列表
     */
    factories?: (() => DbFactoryOption<any, any>)[];

    paths?: {
        /**
         * 迁移文件路径
         */
        migration?: string;
    };
};
```

#### 默认配置

```typescript
/**
 * 数据库配置构造器创建
 * @param register
 */
export const createDbConfig: (
    register: ConfigureRegister<RePartial<DbConfig>>,
) => ConfigureFactory<DbConfig, DbOptions> = (register) => ({
    register,
    hook: (configure, value) => createDbOptions(value),
    defaultRegister: () => ({
        common: {
            charset: 'utf8mb4',
            logging: ['error'],
            seedRunner: SeedRunner,
            seeders: [],
            factories: [],
        },
        connections: [],
    }),
});
```

### 数据工厂

#### 类型

```typescript

/** ****************************** 数据填充Factory **************************** */
/**
 * Factory解析器
 */
export interface DbFactory {
    <Entity>(entity: EntityTarget<Entity>): <Options>(
        options?: Options,
    ) => DataFactory<Entity, Options>;
}

/**
 * Factory处理器
 */
export type DbFactoryHandler<E, O> = (configure: Configure, options: O) => Promise<E>;

/**
 * 数据填充函数映射对象
 */
export type FactoryOptions = {
    [entityName: string]: DbFactoryOption<any, any>;
};

/**
 * Factory处理器
 */
export type DbFactoryHandler<E, O> = (configure: Configure, faker: Faker, options: O) => Promise<E>;

/**
 * Factory自定义参数覆盖
 */
export type FactoryOverride<Entity> = {
    [Property in keyof Entity]?: Entity[Property];
};

/**
 * Factory构造器
 */
export type DbFactoryBuilder = (
    configure: Configure,
    dataSource: DataSource,
    factories: {
        [entityName: string]: DbFactoryOption<any, any>;
    },
) => DbFactory;

/**
 * Factory定义器
 */
export type DefineFactory = <E, O>(
    entity: ObjectType<E>,
    handler: DbFactoryHandler<E, O>,
) => () => DbFactoryOption<E, O>;
```

#### 构建器

```typescript
import { isPromise } from 'util/types';

import { isNil } from 'lodash';
import { EntityManager, EntityTarget } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { panic } from '@/modules/core/helpers';

import { DbFactoryHandler, FactoryOverride } from '../types';

/**
 * 运行Factory
 */
export class DataFactory<Entity, Settings> {
    private mapFunction!: (entity: Entity) => Promise<Entity>;

    constructor(
        public name: string,
        public configure: Configure,
        public entity: EntityTarget<Entity>,
        protected em: EntityManager,
        protected factory: DbFactoryHandler<Entity, Settings>,
        protected settings: Settings,
    ) {}

    /**
     * Entity映射
     * 用于一个Entity类绑定其它实现函数,此时Entity只作为一个键名
     * @param mapFunction
     */
    map(mapFunction: (entity: Entity) => Promise<Entity>): DataFactory<Entity, Settings> {
        this.mapFunction = mapFunction;
        return this;
    }

    /**
     * 创建模拟数据,但不存储
     * @param overrideParams
     */
    async make(overrideParams: FactoryOverride<Entity> = {}): Promise<Entity> {
        if (this.factory) {
            let entity: Entity = await this.resolveEntity(
                await this.factory(this.configure, this.settings),
            );
            if (this.mapFunction) entity = await this.mapFunction(entity);
            for (const key in overrideParams) {
                if (overrideParams[key]) {
                    entity[key] = overrideParams[key]!;
                }
            }
            return entity;
        }
        throw new Error('Could not found entity');
    }

    /**
     * 创建模拟数据并存储
     * @param overrideParams
     * @param existsCheck
     */
    async create(
        overrideParams: FactoryOverride<Entity> = {},
        existsCheck?: string,
    ): Promise<Entity> {
        try {
            const entity = await this.make(overrideParams);
            if (!isNil(existsCheck)) {
                const repo = this.em.getRepository(this.entity);
                const value = (entity as any)[existsCheck];
                if (!isNil(value)) {
                    const item = await repo.findOneBy({ [existsCheck]: value } as any);
                    if (isNil(item)) return await this.em.save(entity);
                    return item;
                }
            }
            return await this.em.save(entity);
        } catch (error) {
            const message = 'Could not save entity';
            panic({ message, error });
            throw new Error(message);
        }
    }

    /**
     * 创建多条模拟数据但不存储
     * @param amount
     * @param overrideParams
     */
    async makeMany(
        amount: number,
        overrideParams: FactoryOverride<Entity> = {},
    ): Promise<Entity[]> {
        const list = [];
        for (let index = 0; index < amount; index += 1) {
            list[index] = await this.make(overrideParams);
        }
        return list;
    }

    /**
     * 创建多条模拟数据并存储
     * @param amount
     * @param overrideParams
     */
    async createMany(
        amount: number,
        overrideParams: FactoryOverride<Entity> = {},
        existsCheck?: string,
    ): Promise<Entity[]> {
        const list = [];
        for (let index = 0; index < amount; index += 1) {
            list[index] = await this.create(overrideParams, existsCheck);
        }
        return list;
    }

    /**
     * 根据Entity解析出其定义的处理器
     * @param entity
     */
    private async resolveEntity(entity: Entity): Promise<Entity> {
        for (const attribute in entity) {
            if (entity[attribute]) {
                if (isPromise(entity[attribute])) {
                    entity[attribute] = await Promise.resolve(entity[attribute]);
                }

                if (typeof entity[attribute] === 'object' && !(entity[attribute] instanceof Date)) {
                    const subEntityFactory = entity[attribute];
                    try {
                        if (typeof (subEntityFactory as any).make === 'function') {
                            entity[attribute] = await (subEntityFactory as any).make();
                        }
                    } catch (error) {
                        const message = `Could not make ${(subEntityFactory as any).name}`;
                        panic({ message, error });
                        throw new Error(message);
                    }
                }
            }
        }
        return entity;
    }

```

#### 工厂函数

```typescript
/**
 * 获取Entity类名
 *
 * @export
 * @template T
 * @param {ObjectType<T>} entity
 * @returns {string}
 */
export function entityName<T>(entity: EntityTarget<T>): string {
    if (entity instanceof Function) return entity.name;
    if (!isNil(entity)) return new (entity as any)().constructor.name;
    throw new Error('Enity is not defined');
}


/**
 * Factory构建器
 * @param configure 配置对象
 * @param dataSource Factory构建器
 * @param factories factory函数组
 */
export const factoryBuilder: DbFactoryBuilder =
    (configure, dataSource, factories) => (entity) => (settings) => {
        const name = entityName(entity);
        if (!factories[name]) {
            throw new Error(`has none factory for entity named ${name}`);
        }
        return new DataFactory(
            name,
            configure,
            entity,
            dataSource.createEntityManager(),
            factories[name].handler,
            settings,
        );
    };

/**
 * 定义factory用于生成数据
 * @param entity 模型
 * @param handler 处理器
 */
export const defineFactory: DefineFactory = (entity, handler) => () => ({
    entity,
    handler,
});
```

#### Faker本地化

```typescript
export const getFakerLocales = async (configure: Configure) => {
    const app = await configure.get<AppConfig>('app');
    const locales: fakerjs.LocaleDefinition[] = [];
    const locale = app.locale as keyof typeof fakerjs;
    const fallbackLocale = app.fallbackLocale as keyof typeof fakerjs;
    if (!isNil(fakerjs[locale])) locales.push(fakerjs[locale] as fakerjs.LocaleDefinition);
    if (!isNil(fakerjs[fallbackLocale]))
        locales.push(fakerjs[fallbackLocale] as fakerjs.LocaleDefinition);
    return locales;
};
```

### 数据填充

#### 类型

```typescript
/** ****************************** 数据填充Seeder **************************** */

/**
 * 数据填充命令参数
 */
export type SeederArguments = TypeOrmArguments & SeederOptions;

/**
 * 数据填充处理器选项
 */
export interface SeederOptions {
    connection?: string;
    transaction?: boolean;
    ignorelock?: boolean;
}

/**
 * 数据填充类接口
 */
export interface SeederConstructor {
    new (spinner: Ora, args: SeederOptions): Seeder;
}

/**
 * 数据填充类方法对象
 */
export interface Seeder {
    load: (params: SeederLoadParams) => Promise<void>;
}

/**
 * 数据填充类的load函数参数
 */
export interface SeederLoadParams {
    /**
     * 数据库连接名称
     */
    connection: string;
    /**
     * 数据库连接池
     */
    dataSource: DataSource;

    /**
     * EntityManager实例
     */
    em: EntityManager;

    /**
     * Factory解析器
     */
    factorier?: DbFactory;
    /**
     * Factory函数列表
     */
    factories: FactoryOptions;

    /**
     * 项目配置类
     */
    configure: Configure;
  
    /**
     * 是否忽略锁定
     */
    ignoreLock: boolean;
}
```

#### 基础类

```typescript
/**
 * 数据填充基类
 */
export abstract class BaseSeeder implements Seeder {
    protected dataSource: DataSource;

    protected em: EntityManager;

    protected connection = 'default';

    protected configure: Configure;

    protected ignoreLock = false;

    // protected

    protected factories!: {
        [entityName: string]: DbFactoryOption<any, any>;
    };

    protected truncates: EntityTarget<ObjectLiteral>[] = [];

    constructor(
        protected readonly spinner: Ora,
        protected readonly args: SeederOptions,
    ) {}

    /**
     * 清空原数据并重新加载数据
     * @param params
     */
    async load(params: SeederLoadParams): Promise<any> {
        const { factorier, factories, dataSource, em, connection, configure, ignoreLock } = params;
        this.connection = connection;
        this.dataSource = dataSource;
        this.em = em;
        this.factories = factories;
        this.configure = configure;
        this.ignoreLock = ignoreLock;
        if (this.ignoreLock) {
            for (const truncate of this.truncates) {
                await this.em.clear(truncate);
            }
        }
      
        const result = await this.run(factorier, this.dataSource);
        return result;
    }

    protected async getDbConfig() {
        const { connections = [] }: DbConfig = await this.configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === this.connection);
        if (isNil(dbConfig)) panic(`Database connection named ${this.connection} not exists!`);
        return dbConfig;
    }

    /**
     * 运行seeder的关键方法
     * @param factorier
     * @param dataSource
     * @param em
     */
    protected abstract run(
        factorier?: DbFactory,
        dataSource?: DataSource,
        em?: EntityManager,
    ): Promise<any>;

    /**
     * 运行子seeder
     *
     * @param SubSeeder
     */
     protected async call(SubSeeder: SeederConstructor) {
        const subSeeder: Seeder = new SubSeeder(this.spinner, this.args);
        await subSeeder.load({
            connection: this.connection,
            factorier: factoryBuilder(this.configure, this.dataSource, this.factories),
            factories: this.factories,
            dataSource: this.dataSource,
            em: this.em,
            configure: this.configure,
            ignoreLock: this.ignoreLock,
        });
    }
}
```

#### 运行器

```typescript
/**
 * 默认的Seed Runner
 */
export class SeedRunner extends BaseSeeder {
    /**
     * 运行一个连接的填充类
     * @param _factory
     * @param _dataSource
     */
    async run(_factory: DbFactory, _dataSource: DataSource): Promise<any> {
        let seeders: Type<any>[] = ((await this.getDbConfig()) as any).seeders ?? [];
        if (!this.ignoreLock) {
            const seedLockFile = resolve(__dirname, '../../../..', 'seed-lock.yml');
            ensureFileSync(seedLockFile);
            const yml = YAML.parse(readFileSync(seedLockFile, 'utf8'));
            const locked = isNil(yml) ? {} : yml;
            const lockNames = get<string[]>(locked, this.connection, []).reduce<string[]>(
                (o, n) => (o.includes(n) ? o : [...o, n]),
                [],
            );
            seeders = seeders.filter((s) => !lockNames.includes(s.name));
            for (const seeder of seeders) {
                await this.call(seeder);
            }
            set(locked, this.connection, [
                ...lockNames.filter((n) => !isNil(n)),
                ...seeders.map((s) => s.name).filter((n) => !isNil(n)),
            ]);
            writeFileSync(seedLockFile, JSON.stringify(locked, null, 4));
        } else {
            for (const seeder of seeders) {
                await this.call(seeder);
            }
        }
    }
}
```

#### 忽略外键

```typescript
/**
 * 忽略外键
 * @param em EntityManager实例
 * @param type 数据库类型
 * @param disabled 是否禁用
 */
export async function resetForeignKey(
    em: EntityManager,
    type = 'mysql',
    disabled = true,
): Promise<EntityManager> {
    let key: string;
    let query: string;
    if (type === 'sqlite') {
        key = disabled ? 'OFF' : 'ON';
        query = `PRAGMA foreign_keys = ${key};`;
    } else {
        key = disabled ? '0' : '1';
        query = `SET FOREIGN_KEY_CHECKS = ${key};`;
    }
    await em.query(query);
    return em;
}
```

#### 填充函数

```typescript
/**
 *
 * @param Clazz 填充类
 * @param args 填充命令参数
 * @param spinner Ora雪碧图标
 * @param configure 配置对象
 * @param dbConfig 当前数据库连接池的配置
 */
export async function runSeeder(
    Clazz: SeederConstructor,
    args: SeederOptions,
    spinner: Ora,
    configure: Configure,
    dbConfig: TypeormOption,
): Promise<DataSource> {
    const seeder: Seeder = new Clazz(spinner, args);
    const dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);

    await dataSource.initialize();
    const factoryMaps: FactoryOptions = {};
    for (const factory of dbConfig.factories) {
        const { entity, handler } = factory();
        factoryMaps[entity.name] = { entity, handler };
    }
    if (typeof args.transaction === 'boolean' && !args.transaction) {
        const em = await resetForeignKey(dataSource.manager, dataSource.options.type);
        await seeder.load({
            factorier: factoryBuilder(configure, dataSource, factoryMaps),
            factories: factoryMaps,
            dataSource,
            em,
            configure,
            connection: args.connection ?? 'default',
            ignoreLock: args.ignorelock,
        });
        await resetForeignKey(em, dataSource.options.type, false);
    } else {
        // 在事务中运行
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const em = await resetForeignKey(queryRunner.manager, dataSource.options.type);
            await seeder.load({
                factorier: factoryBuilder(configure, dataSource, factoryMaps),
                factories: factoryMaps,
                dataSource,
                em,
                configure,
                connection: args.connection ?? 'default',
                ignoreLock: args.ignorelock,
            });
            await resetForeignKey(em, dataSource.options.type, false);
            // 提交事务
            await queryRunner.commitTransaction();
        } catch (err) {
            console.log(err);
            // 遇到错误则回滚
            await queryRunner.rollbackTransaction();
        } finally {
            // 执行事务
            await queryRunner.release();
        }
    }
    if (dataSource.isInitialized) await dataSource.destroy();
    return dataSource;
}
```

#### 执行器

```typescript
/**
 * 数据填充命令处理器
 * @param args
 * @param configure
 */
export const SeedHandler = async (configure: Configure, args: SeederOptions) => {
    const cname = args.connection ?? 'default';
    const { connections = [] }: DbOptions = await configure.get<DbOptions>('database');
    const dbConfig = connections.find(({ name }) => name === cname);
    if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
    const runner = dbConfig.seedRunner;
    const spinner = ora('Start run seeder');
    try {
        spinner.start();
        await runSeeder(runner, args, spinner, configure, dbConfig);
        spinner.succeed(`\n 👍 ${chalk.greenBright.underline(`Finished Seeding`)}`);
    } catch (error) {
        panic({ spinner, message: `Run seeder failed`, error });
    }
};
```

#### 命令

```typescript
/**
 * 数据填充
 */
export const SeedCommand: CommandItem<any, SeederArguments> = async ({ configure }) => ({
    command: ['db:seed', 'dbs'],
    describe: 'Runs all seeds data.',
    builder: {
        clear: {
            type: 'boolean',
            alias: 'r',
            describe: 'Clear which tables will truncated specified by seeder class.',
            default: true,
        },
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        transaction: {
            type: 'boolean',
            alias: 't',
            describe: 'If is seed data in transaction,default is true',
            default: true,
        },
        ignorelock: {
            type: 'boolean',
            alias: 'i',
            describe: 'Ignore seed lock and reset all seeds, not do it in production',
            default: false,
        },
    } as const,

    handler: async (args: Arguments<SeederArguments>) => SeedHandler(configure, args),
});

...
export * from './seed.command';
```

## 填充测试

### 模拟数据

```typescript
export interface PostData {
    title: string;
    contentFile: string;
    summary?: string;
    category?: string;
    tags?: string[];
}

export interface CategoryData {
    name: string;
    children?: CategoryData[];
}

export interface TagData {
    name: string;
}

export interface ContentConfig {
    fixture?: {
        categories: CategoryData[];
        posts: PostData[];
    };
}

export const posts: PostData[] = [
    {
        title: '基于角色和属性的Node.js访问控制',
        contentFile: 'rbac.md',
        category: '后端',
        tags: ['node'],
    },
    {
        title: 'docker简介',
        contentFile: 'docker-introduce.md',
        category: '运维',
        tags: ['devops'],
    },
    {
        title: 'go协程入门',
        contentFile: 'goroutings.md',
        category: '后端',
        tags: ['go'],
    },
    {
        title: '基于lerna.js构建monorepo',
        contentFile: 'lerna.md',
        category: '后端',
        tags: ['ts'],
    },
    {
        title: '通过PHP理解IOC编程',
        contentFile: 'php-di.md',
        category: '后端',
        tags: ['php'],
    },
    {
        title: '玩转React Hooks',
        contentFile: 'react-hooks.md',
        category: '前端',
        tags: ['react'],
    },
    {
        title: 'TypeORM fixtures cli中文说明',
        contentFile: 'typeorm-fixtures-cli.md',
        category: '后端',
        tags: ['ts', 'node'],
    },
    {
        title: '使用yargs构建node命令行(翻译)',
        contentFile: 'yargs.md',
        category: '后端',
        tags: ['ts', 'node'],
    },
    {
        title: 'Typescript装饰器详解',
        summary:
            '装饰器用于给类,方法,属性以及方法参数等增加一些附属功能而不影响其原有特性。其在Typescript应用中的主要作用类似于Java中的注解,在AOP(面向切面编程)使用场景下非常有用',
        contentFile: 'typescript-decorator.md',
        category: '基础',
        tags: ['ts'],
    },
];

export const categories: CategoryData[] = [
    {
        name: '技术文档',
        children: [
            {
                name: '基础',
            },
            {
                name: '前端',
            },
            {
                name: '后端',
            },
            {
                name: '运维',
            },
        ],
    },
    {
        name: '随笔记忆',
        children: [
            {
                name: '工作历程',
            },
            {
                name: '网站收藏',
            },
        ],
    },
];

export const tags: TagData[] = [
    {
        name: 'ts',
    },
    {
        name: 'react',
    },
    {
        name: 'node',
    },
    {
        name: 'go',
    },
    {
        name: 'php',
    },
    {
        name: 'devops',
    },
];
```

### 数据工厂

```typescript

export type IPostFactoryOptions = Partial<{
    title: string;
    summary: string;
    body: string;
    isPublished: boolean;
    category: CategoryEntity;
    tags: TagEntity[];
    comments: CommentEntity[];
}>;
export const ContentFactory = defineFactory(
    PostEntity,
    async (configure: Configure, options: IPostFactoryOptions) => {
        const faker = new fakerjs.Faker({
            locale: await getFakerLocales(configure),
        });
        const post = new PostEntity();
        const { title, summary, body, category, tags } = options;
        post.title = title ?? faker.lorem.sentence(Math.floor(Math.random() * 10) + 6);
        if (summary) {
            post.summary = options.summary;
        }
        post.body = body ?? faker.lorem.paragraph(Math.floor(Math.random() * 500) + 1);
        post.publishedAt = (await getTime(configure)).toDate();
        if (Math.random() >= 0.5) {
            post.deletedAt = (await getTime(configure)).toDate();
        }
        if (category) {
            post.category = category;
        }
        if (tags) {
            post.tags = tags;
        }
        return post;
    },
);
```

### 辅助函数

```typescript
/**
 * 获取小于N的随机整数
 * @param count
 */
export const getRandomIndex = (count: number) => Math.floor(Math.random() * count);

/**
 * 从列表中获取一个随机项
 * @param list
 */
export const getRandItemData = <T extends Record<string, any>>(list: T[]) => {
    return list[getRandomIndex(list.length)];
};

/**
 * 从列表中获取多个随机项组成一个新列表
 * @param list
 */
export const getRandListData = <T extends Record<string, any>>(list: T[]) => {
    const result: T[] = [];
    for (let i = 0; i < getRandomIndex(list.length); i++) {
        const random = getRandItemData<T>(list);
        if (!result.find((item) => item.id === random.id)) {
            result.push(random);
        }
    }
    return result;
};
```

### 填充实现

```typescript
export default class ContentSeeder extends BaseSeeder {
    protected truncates = [PostEntity, CategoryEntity, CommentEntity];

    protected factorier!: DbFactory;

    async run(_factorier: DbFactory, _dataSource: DataSource, _em: EntityManager): Promise<any> {
        this.factorier = _factorier;
        await this.loadCategories(categories);
        await this.loadTags(tags);
        await this.loadPosts(posts);
    }

    private async genRandomComments(post: PostEntity, count: number, parent?: CommentEntity) {
        const comments: CommentEntity[] = [];
        for (let i = 0; i < count; i++) {
            const comment = new CommentEntity();
            comment.body = faker.lorem.paragraph(Math.floor(Math.random() * 18) + 1);
            comment.post = post;
            if (parent) {
                comment.parent = parent;
            }
            comments.push(await this.em.save(comment));
            if (Math.random() >= 0.8) {
                comment.children = await this.genRandomComments(
                    post,
                    Math.floor(Math.random() * 2),
                    comment,
                );
                await this.em.save(comment);
            }
        }
        return comments;
    }

    private async loadCategories(data: CategoryData[], parent?: CategoryEntity): Promise<void> {
        let order = 0;
        for (const item of data) {
            const category = new CategoryEntity();
            category.name = item.name;
            category.customOrder = order;
            if (parent) category.parent = parent;
            await this.em.save(category);
            order++;
            if (item.children) {
                await this.loadCategories(item.children, category);
            }
        }
    }

    private async loadTags(data: TagData[]): Promise<void> {
        for (const item of data) {
            const tag = new TagEntity();
            tag.name = item.name;
            await this.em.save(tag);
        }
    }

    private async loadPosts(data: PostData[]) {
        const allCategories = await this.em.find(CategoryEntity);
        const allTags = await this.em.find(TagEntity);
        for (const item of data) {
            const filePath = path.join(__dirname, '../../assets/posts', item.contentFile);
            if (!existsSync(filePath)) {
                panic({
                    spinner: this.spinner,
                    message: `post content file ${filePath} not exits!`,
                });
            }
            const options: IPostFactoryOptions = {
                title: item.title,
                body: fs.readFileSync(filePath, 'utf8'),
                isPublished: true,
            };
            if (item.summary) {
                options.summary = item.summary;
            }
            if (item.category) {
                options.category = await getCustomRepository(
                    this.dataSource,
                    CategoryRepository,
                ).findOneBy({ id: item.category });
            }
            if (item.tags) {
                options.tags = await getCustomRepository(this.dataSource, TagRepository).find({
                    where: { name: In(item.tags) },
                });
            }
            const post = await this.factorier(PostEntity)(options).create();

            await this.genRandomComments(post, Math.floor(Math.random() * 5));
        }
        const redoms = await this.factorier(PostEntity)<IPostFactoryOptions>({
            tags: getRandListData(allTags),
            category: getRandItemData(allCategories),
        }).createMany(23);
        for (const redom of redoms) {
            await this.genRandomComments(redom, Math.floor(Math.random() * 2));
        }
    }
}

```

### 配置添加

```typescript

export const database = createDbConfig((configure) => ({
    common: {
        // synchronize: true,
    },
    connections: [
        {
            ...
            factories: [ContentFactory],
            seeders: [ContentSeeder],
        },
    ],
}));
```

### 运行命令

![](https://img.pincman.com/media/202310311958492.png)

![](https://img.pincman.com/media/202310311958744.png)
