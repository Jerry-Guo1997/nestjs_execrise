---
title: 自建配置系统实现
sidebar_label: 自建配置系统实现
hide_title: true
sidebar_position: 12
---

:::tip
本节与下一节难度较高，需要极大的耐心去理解和掌握，请大家花费些许时间学习
:::

## 预装类库

- `dotenv`是一个用于读取类似`.env`这样的文件中的键值对并把它们转换成json对象的库，在这里我们用于读取环境变量
- `find-up`用于向上查找文件，这里用于向上查找`.env.{运行环境}`及`.env`文件
- `fs-extra`是一个比原生`fs`更方便的文件操作模块
- `yaml`用于转义yaml文件中的内容为键值对的对象或者反向，此处用于动态存储配置
```shell
pnpm add dotenv chalk find-up fs-extra yaml
pnpm add @types/fs-extra -D
```
## 运行环境

本科代码中有用到`await import('find-up')`,`await  import('chalk')`这种方式导入模块。因为这些模块的最新版本只支持**esm**模式，已经不支持**commonjs**了。这种动态导入模块的方式是在commonjs中使用esm的唯一办法。

为了使用这种方法，我们需要修改一下`tsconfig.json`，请修改以下两个字段

```typescript
// tsconfig.json
{
    "compilerOptions": {
        "target": "esnext",
        "module": "Node16",
```

因为课程中使用了swc，所以还需要配置一下swc(如果使用tsc则不需要管)

根目录下添加一个`.swrrc`文件，其内容如下

:::note

如`ignoreDynamic`有报错，忽略即可

:::

```typescript
{
    "$schema": "https://json.schemastore.org/swcrc",
    "sourceMaps": true,
    "module": {
        "type": "commonjs",
        "ignoreDynamic": true
    }
}
```

然后进行以下修改

一、把所有的`Relation`导入改成类型导入

比如

```typescript
// src/modules/content/entities/category.entity.ts
import type { Relation } from 'typeorm';
```

二、把`MeilliService`中对`MelliConfig`的导入改成类型导入

```typescript
// src/modules/meilisearch/meilli.service.ts
import type { MelliConfig } from './types';
```

三、把`PostService`中对`SearchType`的导入改成类型导入

```typescript
// src/modules/content/services/post.service.ts
import type { SearchType } from '../types';
```

## 配置模块

### 环境变量

`EnvironmentType`用于定义当前的运行环境变量，预定义6个，也可以自己增加其他的环境变量

```typescript
// src/modules/config/constants.ts
export enum EnvironmentType {
    DEVELOPMENT = 'development',
    DEV = 'dev',
    PRODUCTION = 'production',
    PROD = 'prod',
    TEST = 'test',
    PREVIEW = 'preview',
}

```

环境变量操作类

- `load`用于读取所有环境变量并合并到`proccess.env`中。读取步骤为先读取`proccess.env`中的所有环境变量，然后读取`.env`中的环境变量（如果通过`find-up`向上查找能找到`.env`文件的话），加载`.env`中的环境变量并覆盖合并`process.env`，接着再读取`.env.{运行环境}`（比如`.env.development`）中的环境变量（如果通过`find-up`向上查找能找到该文件的话），加载该文件中的环境变量并覆盖合合并`process.env`，得到最终的`process.env`
- `get`用于获取环境变量，这是一个重载函数。当没有参数传入时获取所有环境变量；当传入一个参数时获取该参数对应的环境变量；当传入两个参数且第二参数转译函数时则对获取的环境变量进行类型转译；当传入两个参数且第二个参数不是函数时，则第二个参数为此环境不存在时的默认值；当传入三个参数时，则第一个为环境变量的键名，第二个为类型转译函数，第三个为默认值
- `run`用于获取当前的运行环境的值，可以是`EnvironmentType`枚举中的任何一个,也可以通过`package.json中`的`scripts`传入任意自定义运行环境。而在开发环境中我们不需要指定，因为默认在通过`load`方法初始化环境变量时已经设置为`development`

```typescript
// src/modules/config/env.ts
export class Env {
    /**
     * 加载环境变量
     */
    async load() {
        /**
         * 默认在开发环境运行
         */
        if (isNil(process.env.NODE_ENV)) process.env.NODE_ENV = EnvironmentType.DEVELOPMENT;
        // 从当前运行应用的目录开始,向上查找.env文件,直到找到第一个文件为止
        // 没有找到则返回undefined
        const search = [findUp.sync(['.env'])];
        // 从当前运行应用的目录开始,向上寻找.env.{环境变量文件},直到找到第一个文件为止,如.env.local
        // 如果是development、dev、production、prod环境则同时查找两个
        // 没有找到则返回undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (this.isDev()) {
            search.push(
                findUp.sync([`.env.${EnvironmentType.DEVELOPMENT}`, `.env.${EnvironmentType.DEV}`]),
            );
        } else if (this.isProd()) {
            search.push(
                findUp.sync([`.env.${EnvironmentType.PRODUCTION}`, `.env.${EnvironmentType.PROD}`]),
            );
        } else {
            search.push(findUp.sync([`.env.${this.run()}`]));
        }
        // 过滤掉undefined,把找到的环境变量文件放入envFiles数组
        const envFiles = search.filter((file) => file !== undefined) as string[];
        // 转义每个环境变量文件中的内容为一个对象并让前者覆盖合并后者
        // 如.env.{环境变量文件}会覆盖合并.env
        // 然后,得到所有文件中配置的环境变量对象
        const fileEnvs = envFiles
            .map((filePath) => parse(readFileSync(filePath)))
            .reduce(
                (oc, nc) => ({
                    ...oc,
                    ...nc,
                }),
                {},
            );
        // 文件环境变量与系统环境变量合并
        const envs = { ...process.env, ...fileEnvs };
        // 过滤出在envs中存在而在process.env中不存在的键
        const keys = Object.keys(envs).filter((key) => !(key in process.env));
        // 把.env*中存在而系统环境变量中不存在的键值对追加到process.env中
        // 这样就可以得到最终环境变量 process.env
        keys.forEach((key) => {
            process.env[key] = envs[key];
        });
    }

    /**
     * 当前运行环境,如果production, development等
     */
    run() {
        return process.env.NODE_ENV as EnvironmentType & RecordAny;
    }

    /**
     * 是否在生产环境运行
     */
    isProd() {
        return this.run() === EnvironmentType.PRODUCTION || this.run() === EnvironmentType.PROD;
    }

    /**
     * 是否在开发环境运行
     */
    isDev() {
        return this.run() === EnvironmentType.DEVELOPMENT || this.run() === EnvironmentType.DEV;
    }

    /**
     * 获取全部环境变量
     */
    get(): { [key: string]: string };

    /**
     * 直接获取环境变量
     * @param key
     */
    get<T extends BaseType = string>(key: string): T;

    /**
     * 获取类型转义后的环境变量
     * @param key
     * @param parseTo 类型转义函数
     */
    get<T extends BaseType = string>(key: string, parseTo: ParseType<T>): T;

    /**
     * 获取环境变量,不存在则获取默认值
     * @param key
     * @param defaultValue 默认值
     */
    get<T extends BaseType = string>(key: string, defaultValue: T): T;

    /**
     * 获取类型转义后的环境变量,不存在则获取默认值
     * @param key
     * @param parseTo 类型转义函数
     * @param defaultValue 默认值
     */
    get<T extends BaseType = string>(key: string, parseTo: ParseType<T>, defaultValue: T): T;

    /**
     * 获取环境变量
     * @param key
     * @param parseTo 类型转义函数
     * @param defaultValue 默认值
     */
    get<T extends BaseType = string>(key?: string, parseTo?: ParseType<T> | T, defaultValue?: T) {
        if (!key) return process.env;
        const value = process.env[key];
        if (value !== undefined) {
            if (parseTo && isFunction(parseTo)) {
                return parseTo(value);
            }
            return value as T;
        }
        if (parseTo === undefined && defaultValue === undefined) {
            return undefined;
        }
        if (parseTo && defaultValue === undefined) {
            return isFunction(parseTo) ? undefined : parseTo;
        }
        return defaultValue! as T;
    }
}

```

### 配置存储

有时候一些配置我们需要长期存储的配置存储到一个文件里，在修改改配置并重启应用后，去读取存储该配置文件中这些配置。

这可以使得不需要把所有可修改的配置全部通过数据库存取修改，使应用性能得到提升性能。

我们编写一个`Storage`类并通过`yaml`文件来存储与读取。此类代码比较简单，不做过多解释，请自行研究。

**但需要注意的一点是: 如果你是通过CICD部署的话，最好把`config.yml`放到应用外面。因为CICD是把编译出来的dist作为应用部署而不是整个源代码，但是每次更新应用我们往往会替换掉整个应用，所以`config.yml`部署在应用代码外部才不会导致现有的设置应该文件被替换而导致失效**

```typescript
// src/modules/config/storage.ts
import YAML from 'yaml';

export class Storage {
    /**
     * 是否开启存储配置功能
     */
    protected _enabled = false;

    /**
     * yaml文件配置路径
     */
    protected _path = resolve(__dirname, '../../..', 'config.yml');

    /**
     * 存储在yaml中的配置对象
     */
    protected _config: Record<string, any> = {};

    get enabled() {
        return this._enabled;
    }

    get path() {
        return this._path;
    }

    get config() {
        return this._config;
    }

    /**
     * 构造函数
     * @param enabled 是否开启存储配置功能
     * @param filePath 存盘配置存放的文件路径
     */
    constructor(enabled?: boolean, filePath?: string) {
        this._enabled = isNil(enabled) ? this._enabled : enabled;
        if (this._enabled) {
            if (!isNil(filePath)) this._path = filePath;
            ensureFileSync(this._path);
            const config = YAML.parse(readFileSync(this._path, 'utf8'));
            this._config = isNil(config) ? {} : config;
        }
    }

    /**
     * 设置存储配置
     * @param key
     * @param value
     */
    set<T>(key: string, value: T) {
        ensureFileSync(this.path);
        set(this._config, key, value);
        writeFileSync(this.path, JSON.stringify(this.path, null, 4));
    }

    /**
     * 删除存储配置
     * @param key
     */
    remove(key: string) {
        this._config = omit(this._config, [key]);
        if (has(this._config, key)) omit(this._config, [key]);
        writeFileSync(this.path, JSON.stringify(this._config, null, 4));
    }
}
```

### 配置类

配置类就是整个配置的核心模块，该模块用于对我们的配置进行CRUD操作

首先，需要编写以下几个类型

- `ConfigStorageOption`: 用于设置存储配置类初始化的选项
- `ConfigureRegister`: 配置注册器函数类型，用于直接生成一个配置对象的函数供`configure`通过
- `ConfigureFactory`: 完整的配置构造器类型，包括"配置注册器函数"用于生成自定义配置，"默认配置注册器函数"，"该配置是否需要存储"，"对生成的配置进一步处理的钩子函数"以及"把自定义配置合并覆盖默认配置时的数组处理方式：是追加还是替换"
- `ConnectionOption`与`ConnectionRst`，用于`createConnectionOptions`，该函数用于快捷生成Typeorm,Redis,MeilliSearch等工具的多连接配置

:::caution

注意：因为现在还没有配置类，所以类型中使用配置类会报错，下面我们编写好配置类并重新加载Vscode窗口就正常了

:::

```typescript
// src/modules/config/types.ts
import { Configure } from './configure';

/**
 * 存储配置选项
 */
export interface ConfigStorageOption {
    /**
     * 是否开启存储
     */
    enabled?: boolean;
    /**
     * yaml文件路径,默认为dist目录外的config.yaml
     */
    filePath?: string;
}

/**
 * 配置注册器函数
 */
export type ConfigureRegister<T extends Record<string, any>> = (
    configure: Configure,
) => T | Promise<T>;

/**
 * 配置构造器
 */
export interface ConfigureFactory<
    T extends Record<string, any>,
    C extends Record<string, any> = T,
> {
    /**
     * 配置注册器
     */
    register: ConfigureRegister<RePartial<T>>;
    /**
     * 默认配置注册器
     */
    defaultRegister?: ConfigureRegister<T>;
    /**
     * 是否存储该配置
     */
    storage?: boolean;
    /**
     * 回调函数
     * @param configure 配置类服务实例
     * @param value 配置注册器register执行后的返回值
     */
    hook?: (configure: Configure, value: T) => C | Promise<C>;
    /**
     * 深度合并时是否对数组采用追加模式,默认 false
     */
    append?: boolean;
}

/**
 * 多连接连接型配置
 */
export type ConnectionOption<T extends Record<string, any>> = { name?: string } & T;
/**
 * 多连接连接型配置生成的结果
 */
export type ConnectionRst<T extends Record<string, any>> = Array<{ name: string } & T>;
```

编写一个用于判断一个函数是否为异步函数的辅助函数

```typescript
// src/modules/core/helpers/utils.ts

/**
 * 判断一个函数是否为异步函数
 * @param callback
 */
export function isAsyncFn<R, A extends Array<any>>(
    callback: (...asgs: A) => Promise<R> | R,
): callback is (...asgs: A) => Promise<R> {
    const AsyncFunction = (async () => {}).constructor;
    return callback instanceof AsyncFunction === true;
}
```

配置类的逻辑是这样的

1. 在初始化时或者后面通过`add`方法添加配置构造器
1. 然后通过`sync`方法中调用`syncFactory`来执行构造器获取配置并调用`set`方法把配置条件到`config`中
1. 如果有设置了`storage = true`的存储配置，则先存储再读取出来`set`到`config`中
1. 在读取一个`key`的配置时，如果该配置在`config`中不存在则使用`syncFactory`同步该配置(如果存在与该`key`同名的构造器)，然后再读取
1. 上述`4`的目的是在一个配置文件中调用另一个配置时，由于配置是随机同步的，如果被读取的配置可能还没有被同步则会导致不存在无法读取的现象。比如在`bullmq.config.ts`中去读取`redis.config.ts`的配置。但是需要注意，我们必须在读取另外一个配置时读取它的顶级键，比如`configure.get('redis')`，而不是`configure.get('redis.connections')`，否则即时存在`redis`的配置构造器也会读取不到，因为没有与`redis`同名的构造器存在

下面我们看一下配置类的构造

- `inited`属性用于确定这个配置类是否已经被初始化
- `factories`是存放配置构建器函数的对象
- `config`存放所有配置对象
- `_env`与`get _env()`用于设置与获取环境变量操作类的实例
- `storage`是存储配置类的实例

#### initilize

用于对`Configure`类进行初始化

其步骤如下

判断是否已经被初始化，如果已经被初始化则直接返回配置类的实例

1. 实例化`Env`类并加载环境变量到`process.env`
2. 实例化`Storage`类
3. 同步所有配置构造器
4. 把`inited`设置为`true`，代表配置类已经被初始化

#### crud

`all`,`get`,`set`,`add`,`remove`方法分别用于获取全部配置，获取某个配置，设置配置，添加配置构造器，删除配置

注意：

- 在设置配置时，如果`storage`是`true`则存储该配置到yaml文件，如果`append`是`true`，则如果该配置已存在，且其中某个子配置或其本身是一个数组，则就使用追加合并的方式进行设置，如果是`false`则直接覆盖合并
- 在设置配置时，如果改配置的顶级键(例如`app.url`的顶级键是`app`)是个构造器且该构造器有`hook`方法，则最终设置的值为执行`hook`的返回值
- 在删除配置时，如果是存储配置则会在下次启动应用时仍然是删除状态，如果是正常配置，则会在下次启动时复原(除非你在某个应用启动就执行到的地方去删除，那么启动后还是删除状态)

#### 存储配置

- 如果原本一个配置不是存储配置，但是在应用的某个阶段如果你想把它变成存储配置，就可以使用`store`方法来实现
- `sync`方法用于同步配置构造器，执行一个配置构造器函数后把返回的结果赋值到`config`， 其实现是通过调用`syncFactory`来实现的。如果没有传入`name`则循环遍历所有构造器进行同步

`syncFactory`方法是同步一个构造器的逻辑实现，具体步骤为

1. 判断该构造器是否在`factories`里面实现，如果没有实现则返回`Configure`本身的实例，并不进行任何操作
2. 如果该构造器存在，则读取构造器的`register`, `defaultRegister`, `storage`,  `append`等属性
3. 判断构造器的`register`函数是否为异步函数，并执行该函数获取自定义配置(在执行时传入`configure`本身的实例，这样可以在某个配置中获取另一个配置)
4. 判断构造器是否存在`defaultRegister`属性，如果存在则执行以获取默认配置，然后用自定义配置深度合并覆盖默认配置，以获取最终配置
6. 最后，把配置放到`set`方法中添加配置到`config`属性中设置

```typescript
// src/modules/config/configure.ts
/**
 * 设置配置的存储选项
 */
interface SetStorageOption {
    /**
     * 是否存储配置
     */
    enabled?: boolean;
    /**
     * 用于指定如果该配置已经存在在config.yml中时要不要更改
     */
    change?: boolean;
}

/**
 * 配置类
 */
export class Configure {
    /**
     * 配置是否被初始化
     */
    protected inited = false;

    /**
     * 配置构建函数对象
     */
    protected factories: Record<string, ConfigureFactory<Record<string, any>>> = {};

    /**
     * 生成的配置
     */
    protected config: Record<string, any> = {};

    /**
     * 环境变量操作实例
     */
    protected _env: Env;

    /**
     * 存储配置操作实例
     */
    protected storage: Storage;

    /**
     * 初始化配置类
     * @param configs 配置构造器集合对象
     * @param option 配置类选项
     */
    async initilize(configs: Record<string, any> = {}, option: ConfigStorageOption = {}) {
        if (this.inited) return this;
        this._env = new Env();
        await this._env.load();
        const { enabled, filePath } = option;
        this.storage = new Storage(enabled, filePath);
        for (const key in configs) {
            this.add(key, configs[key]);
        }
        await this.sync();
        this.inited = true;
        return this;
    }

    get env() {
        return this._env;
    }

    /**
     * 获取所有配置
     */
    all() {
        return this.config;
    }

    /**
     * 判断配置是否存在
     * @param key
     */
    has(key: string) {
        return has(this.config, key);
    }

    /**
     * 获取配置值
     * @param key
     * @param defaultValue 不存在时返回的默认配置
     */
    async get<T>(key: string, defaultValue?: T): Promise<T> {
        if (!has(this.config, key) && defaultValue === undefined && has(this.factories, key)) {
            await this.syncFactory(key);
            return this.get(key, defaultValue);
        }
        return get(this.config, key, defaultValue) as T;
    }

    /**
     * 设置配置项
     * 如果storage是一个布尔值则只用于确定是否存储该配置,如果该配置已存在在config.yml中则不更改
     * 如果storage是一个对象时,那么其中的enabled用于设置是否存储改配置,change用于指定如果该配置已经存在在config.yml中时要不要更改
     * @param key 配置名
     * @param value 配置值
     * @param storage boolean类型时: 是否存储配置; 对象类型时: enabled 是否存储配置, change 当该配置在config.yml存在时是否改变
     * @param append 如果为true,则如果已经存在的包含数组的配置,使用追加方式合并,否则直接替换
     */
    set<T>(key: string, value: T, storage: SetStorageOption | boolean = false, append = false) {
        const storageEnable = typeof storage === 'boolean' ? storage : !!storage.enabled;
        const storageChange = typeof storage === 'boolean' ? false : !!storage.change;
        if (storageEnable && this.storage.enabled) {
            this.changeStorageValue(key, value, storageChange, append);
        } else {
            set(this.config, key, value);
        }
        return this;
    }

    /**
     * 添加一个新配置集
     * @param key
     * @param register 配置构造器
     */
    add<T extends Record<string, any>>(
        key: string,
        register: ConfigureRegister<T> | ConfigureFactory<T>,
    ) {
        if (!isFunction(register) && 'register' in register) {
            this.factories[key] = register as any;
        } else if (isFunction(register)) {
            this.factories[key] = { register };
        }
        return this;
    }

    /**
     * 删除配置项
     * 如果不是存储配置则为临时删除,重启用户后该配置依然存在
     * @param key
     */
    remove(key: string) {
        if (has(this.storage.config, key) && this.storage.enabled) {
            this.storage.remove(key);
            this.config = deepMerge(this.config, this.storage.config, 'replace');
        } else if (has(this.config, key)) {
            this.config = omit(this.config, [key]);
        }
        return this;
    }

    /**
     * 手动存储一个配置
     * @param key 配置名
     * @param change 用于指定如果该配置已经存在在config.yml中时要不要更改
     * @param append 如果为true,则如果已经存在的包含数组的配置,使用追加方式合并,否则直接替换
     */
    async store(key: string, change = false, append = false) {
        if (!this.storage.enabled) throw new Error('Must enable storage at first!');
        this.changeStorageValue(key, await this.get(key, null), change, append);
        return this;
    }

    /**
     * 同步配置
     * 添加一个配置构造器后需用使用此方法同步到配置中
     */
    async sync(name?: string) {
        if (!isNil(name)) await this.syncFactory(name);
        else {
            for (const key in this.factories) {
                await this.syncFactory(key);
            }
        }
    }

    /**
     * 同步配置构造器
     * @param key
     */
    protected async syncFactory(key: string) {
        if (has(this.config, key) || !has(this.factories, key)) return this;
        const { register, defaultRegister, storage, append } = this.factories[key];
        let defaultValue = {};
        let value = isAsyncFn(register) ? await register(this) : register(this);
        if (!isNil(defaultRegister)) {
            defaultValue = isAsyncFn(defaultRegister)
                ? await defaultRegister(this)
                : defaultRegister(this);
            value = deepMerge(defaultValue, value, 'replace');
        }
        this.set(key, value, storage && isNil(await this.get(key, null)), append);
        return this;
    }
}
```

### 模块编写

把`Configure`类的实例注册成为一个模块，以便在其它需要依赖的地方直接注入

```typescript
// src/modules/config/config.module.ts
@Module({})
export class ConfigModule {
    static forRoot(configure: Configure): DynamicModule {
        return {
            global: true,
            module: ConfigModule,
            providers: [
                {
                    provide: Configure,
                    useValue: configure,
                },
            ],
            exports: [Configure],
        };
    }
}
```

## 应用改造

为了能更好的使用配置模块，我们需要对应用的启动代码进行一些改造

### 应用创建

编写一个用于创建多应用的`createApp`函数，其实一般情况下我们不需要创建多应用，只是为了解除实例的黏连性（自己体会，也可以就一个`app`到处用），所以我们需要创建多应用

首先定义一个应用列表常量用于存放多个应用(再次提醒，一般情况下我们只需要一个应用)，其类型是我们自定义的`App`类型，该类型包含两个属性

- `container`就是我们的Nest应用实例
- `configure`是`Configure`类的实例，与实例化后作为提供者的`configure`实例为同一变量

:::info

这里的`container`属性原则上其实使用`app`更明确，这就是我们的nest应用实例。但是为了和我们自定义的应用概念搞混，所以我们使用容器的译名`container`来代替，这样清晰一些

:::

```typescript
// src/modules/core/types.ts
/**
 * App对象类型
 */
export type App = {
    // 应用容器实例
    container?: NestFastifyApplication;
    // 配置类实例
    configure: Configure;
};
```

#### 创建函数

我们先来定义一下`CreateOptions`类型

- `builder`属性是一个容器构造器(为了防止概念混淆，我们用容器来代替原本的nest应用称谓)，通过`NestFactory.create`来创建一个nest应用实例
- `modules`使用生成导入模块的异步函数，因为我们要在一些需要配置功能的模块种导入`configure`实例，所以不能直接导入模块，而使用异步函数执行后获取
- `globals`用于配置全局的管道等
- `config`配置包含所有的配置数据以及是否存储配置的选项，用于作为实例化`Configure`类的参数

```typescript
// src/modules/core/types.ts
/**
 * 创建应用的选项参数
 */
export interface CreateOptions {
    /**
     * 返回值为需要导入的模块
     */
    modules: (configure: Configure) => Promise<Required<ModuleMetadata['imports']>>;
    /**
     * 应用构建器
     */
    builder: ContainerBuilder;
    /**
     * 全局配置
     */
    globals?: {
        /**
         * 全局管道,默认为AppPipe,设置为null则不添加
         * @param params
         */
        pipe?: (configure: Configure) => PipeTransform<any> | null;
        /**
         * 全局拦截器,默认为AppInterceptor,设置为null则不添加
         */
        interceptor?: Type<any> | null;
        /**
         * 全局过滤器,默认AppFilter,设置为null则不添加
         */
        filter?: Type<any> | null;
    };

    /**
     * 配置选项
     */
    config: {
        /**
         * 初始配置集
         */
        factories: Record<string, ConfigureFactory<Record<string, any>>>;
        /**
         * 配置服务的动态存储选项
         */
        storage: ConfigStorageOption;
    };
}

/**
 * 应用构建器
 */
export interface ContainerBuilder {
    (params: { configure: Configure; BootModule: Type<any> }): Promise<NestFastifyApplication>;
}
```

下面我们来看一下应用创建的具体实现

- 参数: `options`为创建应用的选项参数
- 返回值: 该异步函数返回包含了`container`和`configure`的`App`类型

逻辑如下

- 解构出传入的`config`和`builder`参数
- 创建一个初始化(同步构造器到配置等)后的`configure`实例并赋值给`app`的`configure`属性
- 判断是否存在`app`配置，没有的话抛出`502`服务器错误
- 动态创建一个启动模块，即原来的`AppModule`(`createBootModule`函数后面编写)，在`createBootModule`函数中传入`options`参数，这样，创建的启动模块会自动解析`options.modules`函数获取导入的模块并导入到启动模块中
- 使用传入的`builder`函数创建nest应用实例
- 如果`app`配置中有`prefix`则为nest实例添加访问前缀
- 最后就是整合`class-validator`容器

```typescript
// src/modules/core/helpers/app.ts

export const createApp = (options: CreateOptions) => async (): Promise<App> => {
    const { config, builder } = options;

    // 设置app的配置中心实例
    const app: App = { configure: new Configure() };
    // 初始化配置实例
    await app.configure.initilize(config.factories, config.storage);
    // 如果没有app配置则使用默认配置
    if (!app.configure.has('app')) {
        throw new BadGatewayException('App config not exists!');
    }
    // 创建启动模块
    const BootModule = await createBootModule(app.configure, options);
    // 创建app的容器实例
    app.container = await builder({
        configure: app.configure,
        BootModule,
    });
    // 设置api前缀
    // if (app.configure.has('app.prefix')) {
    //     app.container.setGlobalPrefix(await app.configure.get<string>('app.prefix'));
    // }
    // 为class-validator添加容器以便在自定义约束中可以注入dataSource等依赖
    useContainer(app.container.select(BootModule), {
        fallbackOnErrors: true,
    });
    return app;
};
```

#### 核心模块

修改一下核心模块，以便在第一次启动时存储应用名称

```typescript
@Module({})
export class CoreModule {
    static async forRoot(configure: Configure): Promise<DynamicModule> {
        await configure.store('app.name');
        return {
            module: CoreModule,
            global: true,
            providers: [],
            exports: [],
        };
    }
}
```

#### 启动模块

启动模块用于动态构建一个类似`AppMoudle`一样的启动模块

接收两个参数，`configure`实例以及启动函数的`options`中的`globals`和`modules`

执行逻辑如下

1. 执行`options.modules`函数获取需要导入的模块。异步遍历解析出所有模块，这样在一些通过`static forRoot`中注册的动态模块中也可以获取配置对象了，比如`static async forRoot(configure:Configure)`。然后对模块再一次遍历，如果有`module`属性的动态模块，就把他包装为一个静态模块，最后获取到所有导入的模块列表。
2. 判断是否有传入的自定义的全局管道，拦截器，过滤器，没有使用默认自定义的，然后把它们放入提供者数组
3. 最后通过`CreateModule`抽象模块构建函数来创建一个模块(此函数下面编写)

```typescript
// src/modules/core/helpers/app.ts
export async function createBootModule(
    configure: Configure,
    options: Pick<CreateOptions, 'globals' | 'modules'>,
): Promise<Type<any>> {
    const { globals = {}, imports: moduleCreator } = options;
    // 获取需要导入的模块
    const modules = await options.modules(configure);
     const imports: ModuleMetadata['imports'] = (
         await Promise.all([
            ...modules,
            ConfigModule.forRoot(configure),
            await CoreModule.forRoot(configure),
        ])
    ).map((item) => {
        if ('module' in item) {
            const meta = omit(item, ['module', 'global']);
            Module(meta)(item.module);
            if (item.global) Global()(item.module);
            return item.module;
        }
        return item;
    });
    // 配置全局提供者
    const providers: ModuleMetadata['providers'] = [];
    if (globals.pipe !== null) {
        const pipe = globals.pipe
            ? globals.pipe(configure)
            : new AppPipe({
                  transform: true,
                  whitelist: true,
                  forbidNonWhitelisted: true,
                  forbidUnknownValues: true,
                  validationError: { target: false },
              });
        providers.push({
            provide: APP_PIPE,
            useValue: pipe,
        });
    }
    if (globals.interceptor !== null) {
        providers.push({
            provide: APP_INTERCEPTOR,
            useClass: globals.interceptor ?? AppIntercepter,
        });
    }
    if (globals.filter !== null) {
        providers.push({
            provide: APP_FILTER,
            useClass: AppFilter,
        });
    }

    return CreateModule('BootModule', () => {
        const meta: ModuleMetadata = {
            imports,
            providers,
        };
        return meta;
    });
}
```

#### 抽象模块

本函数接收两个参数

- `target`是构建的模块类名，可以是一个字符串也可以是一个类
- `metaSetter`函数执行后获得传入`@Module`装饰器元数据（如`providers`等）

执行逻辑如下

1. 定义一个`ModuleClass`变量，是一个类的类型
2. 判断传入的`target`类型，如果是一个字符串则给`ModuleClass`赋值一个空类，并使用`Object.defineProperty`把类名设置为`target`；如果是一个类，则把`target`直接赋值给`ModuleClass`
3. 然后执行`metaSetter`函数获取传入的元元素，在把元元素作为参数传入`Module`装饰器(装饰器本身就是一个函数，具体原理可以看"核心概念"这一节)，最后用`Module`装饰器的返回值包装`ModuleClass`得到的效果与把`@Module(metaSetter())`放在类顶部是一致的
4. 最后返回这个抽象模块

```typescript
// src/modules/core/helpers/utils.ts
/**
 * 创建一个动态模块
 * @param target
 * @param metaSetter
 */
export function CreateModule(
    target: string | Type<any>,
    metaSetter: () => ModuleMetadata = () => ({}),
): Type<any> {
    let ModuleClass: Type<any>;
    if (typeof target === 'string') {
        ModuleClass = class {};
        Object.defineProperty(ModuleClass, 'name', { value: target });
    } else {
        ModuleClass = target;
    }
    Module(metaSetter())(ModuleClass);
    return ModuleClass;
}
```

### 应用配置

应用本身的基本配置放在核心模块中

首先定义配置类型

```typescript
// src/modules/core/types.ts
/**
 * 应用配置
 */
export interface AppConfig {
    /**
     * App名称
     */
    name: string;
    /**
     * 主机地址,默认为127.0.0.1
     */
    host: string;
    /**
     * 监听端口,默认3100
     */
    port: number;
    /**
     * 是否开启https,默认false
     */
    https: boolean;
    /**
     * 时区,默认Asia/Shanghai
     */
    timezone: string;
    /**
     * 语言,默认zh-cn
     */
    locale: string;
    /**
     * 控制台打印的url,默认自动生成
     */
    url?: string;
    /**
     * 由url+api前缀生成的基础api url
     */
    prefix?: string;
}
```

然后按照我们自定义的配置器类型格式来编写一个应用配置构建器

首先添加一个生成固定长度的随机字符串的函数

```typescript
// src/modules/core/helpers/utils.ts
export const getRandomCharString = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
```

:::tip

自定义应用配置在后面我们与其它的模块配置一起编写

:::

```typescript
// src/modules/core/constants.ts
/**
 * 默认应用配置
 * @param configure
 */
export const getDefaultAppConfig = (configure: Configure) => ({
     // 生产一个随机应用名
    name: getRandomCharString(9),
    host: configure.env.get('APP_HOST', '127.0.0.1'),
    port: configure.env.get('APP_PORT', (v) => toNumber(v), 3000),
    https: configure.env.get('APP_SSL', (v) => toBoolean(v), false),
    timezone: configure.env.get('APP_TIMEZONE', 'Asia/Shanghai'),
    locale: configure.env.get('APP_LOCALE', 'zh-cn'),
});


// src/modules/core/helpers/app.ts
/**
 * 应用配置工厂
 */
export const createAppConfig: (
    register: ConfigureRegister<RePartial<AppConfig>>,
) => ConfigureFactory<AppConfig> = (register) => ({
    register,
    defaultRegister: (configure) => getDefaultAppConfig(configure),
    hook: (configure: Configure, value) => {
        if (isNil(value.url))
            value.url = `${value.https ? 'https' : 'http'}://${value.host}:${value.port}`;
        return value;
    },
});
```

### 应用启动

现在我们就可以编写启动应用的`startApp`函数了

这个函数接收两个参数

- `creator`是`createApp`执行后返回的`App`类型的对象，包含了`container`(nest应用实例)，`configure`
- `listened`是一个在启动nest应用监听后执行的钩子函数，比如可以在这里输出应用的web地址等等

```typescript
// src/modules/core/helpers/app.ts
/**
 * 构建APP CLI,默认start命令应用启动监听app
 * @param creator APP构建器
 * @param listened 监听回调
 */
export async function startApp(
    creator: () => Promise<App>,
    listened?: (app: App) => () => Promise<void>,
) {
    const app = await creator();
    const { container, configure } = app;
    const { port, host } = await configure.get<AppConfig>('app');
    await container.listen(port, host, listened(app));
}
```

定义应用创建参数常量

:::tip

这里有报错不用管它，下面我们在修改配置和模块

:::

```typescript
// src/constants.ts
import * as configs from './config';

export const WEBAPP = 'web';
export const createData: CreateOptions = {
    config: {
        factories: configs as any,
        storage: { enabled: true },
    },
    modules: async (configure) => [
        DatabaseModule.forRoot(configure),
        MeilliModule.forRoot(configure),
        RestfulModule.forRoot(configure),
        ContentModule.forRoot(configure),
    ],
    globals: {},
    builder: async ({ configure, BootModule }) =>
        NestFactory.create<NestFastifyApplication>(BootModule, new FastifyAdapter(), {
            cors: true,
            logger: ['error', 'warn'],
        }),
};
```

现在可以删除`app.module.ts`了，然后改写`main.ts`

```typescript
// src/main.ts
startApp(createApp(WEBAPP, createData), ({ configure }) => async () => {
    console.log();
    const chalk = (await import('chalk')).default;
    const appUrl = await configure.get<string>('app.url');
    // 设置应用的API前缀,如果没有则与appUrl相同
    const urlPrefix = await configure.get('app.prefix', undefined);
    const apiUrl = !isNil(urlPrefix)
        ? `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`
        : appUrl;
    console.log(`- AppUrl: ${chalk.green.underline(appUrl)}`);
    console.log();
    console.log(`- ApiUrl: ${chalk.green.underline(apiUrl)}`);
});
```

### 配置构造器

现在我们有了配置系统，下面我们就可以根据自己开发的配置系统来添加配置了

#### 应用配置

添加一个应用配置，然后再`src/config/index.ts`中导出即可

```typescript
// src/config/app.config.ts
export const app = createAppConfig((configure) => ({
    port: configure.env.get('APP_PORT', (v) => toNumber(v), 3100),
    prefix: 'api',
}));
```

#### 内容模块配置

为内容模块编写一个配置构造器创建函数

:::info

添加一个`htmlEnabled`类型用于配置是否开启html的文章内容，不开启则只能使用`markdown`

:::

```typescript
// src/modules/content/types.ts
export interface ContentConfig {
    searchType: SearchType;
    htmlEnabled: boolean;
}

// src/modules/content/helpers.ts
export const defaultContentConfig: ContentConfig = { searchType: 'against', htmlEnabled: false };
export const createConfigConfig: (
    register: ConfigureRegister<RePartial<ContentConfig>>,
) => ConfigureFactory<ContentConfig> = (register) => ({
    register,
    defaultRegister: () => defaultContentConfig,
});

// src/config/content.config.ts
export const content = createContentConfig(() => ({
    searchType: 'meilli',
    htmlEnabled: false,
}));
```

#### 连接配置

对于数据库，meilisearch/elasticsearch，redis这种需要多连接的配置，专门为其编写一个函数用来操作`name`属性

```typescript
// src/modules/config/helpers.ts

/**
 * 用于快捷生成Typeorm,Redis等连接的配置
 * @param options
 */
export const createConnectionOptions = <T extends Record<string, any>>(
    config: ConnectionOption<T> | ConnectionOption<T>[],
) => {
    const options = (
        Array.isArray(config) ? config : [{ ...config, name: 'default' }]
    ) as ConnectionRst<T>;
    if (options.length <= 0) return undefined;
    const names = options.map(({ name }) => name);
    if (!names.includes('default')) options[0].name = 'default';

    // 去重
    return options
        .filter(({ name }) => !isNil(name))
        .reduce((o, n) => {
            const oldNames = o.map(({ name }) => name) as string[];
            return oldNames.includes(n.name) ? o : [...o, n];
        }, []);
};
```

#### 数据库配置

为数据库配置添加几个类型

```typescript
// src/modules/database/types.ts
/**
 * 自定义数据库配置
 */
export type DbConfig = {
    common: Record<string, any>;
    connections: Array<TypeOrmModuleOptions>;
};

/**
 * 最终数据库配置
 */
export type DbOptions = Record<string, any> & {
    common: Record<string, any>;
    connections: TypeormOption[];
};

/**
 * Typeorm连接配置
 */
export type TypeormOption = Omit<TypeOrmModuleOptions, 'name' | 'migrations'> & {
    name: string;
};
```

多连接的数据库有一些公共属性，我们放在`common`里面，然后合并配置到每个连接，这就是`createDbOptions`的作用

```typescript
// src/modules/database/helpers.ts

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
        },
        connections: [],
    }),
});

/**
 * 创建数据库配置
 * @param options 自定义配置
 */
export const createDbOptions = (options: DbConfig) => {
    const newOptions: DbOptions = {
        common: deepMerge(
            {
                charset: 'utf8mb4',
                logging: ['error'],
            },
            options.common ?? {},
            'replace',
        ),
        connections: createConnectionOptions(options.connections ?? []),
    };
    newOptions.connections = newOptions.connections.map((connection) => {
        const entities = connection.entities ?? [];
        const newOption = { ...connection, entities };
        return deepMerge(
            newOptions.common,
            {
                ...newOption,
                autoLoadEntities: true,
            } as any,
            'replace',
        ) as TypeormOption;
    });
    return newOptions;
};
```

创建自定义配置

```typescript
// src/config/database.config.ts

export const database = createDbConfig((configure) => ({
    common: {
        synchronize: true,
    },
    connections: [
        {
            // 以下为mysql配置
            type: 'mysql',
            host: '127.0.0.1',
            port: 3306,
            username: 'root',
            password: '12345678',
            database: '3r',
        },
        // {
        // 以下为sqlite配置
        // type: 'better-sqlite3',
        // database: resolve(__dirname, '../../database.db'),
        // },
    ],
}));
```

#### Meilli配置

删除原来的`createMeilliOptions`函数，编写配置构造器创建函数替代

```typescript
// src/modules/meilisearch/helpers.ts
export const createMeilliConfig: (
    register: ConfigureRegister<RePartial<MelliConfig>>,
) => ConfigureFactory<MelliConfig, MelliConfig> = (register) => ({
    register,
    hook: (configure, value) => createConnectionOptions(value),
});
```

#### 导出配置

需要把所有配置在`index.ts`导出来，因为前面在`src/constants.ts`中是通过`import * as configs from './config';`导入所有配置的

```typescript
// src/config/index.ts
export * from './app.config';
export * from './database.config';
export * from './meilli.config';
export * from './content.config';
```

### 修改模块

把需要使用`configure`实例拿配置的几个模块(配置模块除外)的`forRoot`全部改成异步执行

在此之前我们需要先编写一个`panic`函数，用于快捷的报错并停止应用执行

```typescript
// src/modules/core/types.ts
/**
 * 控制台错误函数panic的选项参数
 */
export interface PanicOption {
    /**
     * 报错消息
     */
    message: string;
    /**
     * 抛出的异常信息
     */
    error?: any;
    /**
     * 是否退出进程
     */
    exit?: boolean;
}

// src/modules/core/helpers/utils.ts
/**
 * 输出命令行错误消息
 * @param option
 */
export async function panic(option: PanicOption | string) {
    const chalk = (await import('chalk')).default;
    console.log();
    if (typeof option === 'string') {
        console.log(chalk.red(`\n❌ ${option}`));
        process.exit(1);
    }
    const { error, message, exit = true } = option;
    !isNil(error) ? console.log(chalk.red(error)) : console.log(chalk.red(`\n❌ ${message}`));
    if (exit) process.exit(1);
}
```

#### 数据库模块

在数据库模块中判断`database`配置是否存在，不存在则`panic`报错。配置存在，则遍历连接，并通过`TypeOrmModule.forRoot`连接每个配置

```typescript
// src/modules/database/database.module.ts
@Module({})
export class DatabaseModule {
    static async forRoot(configure: Configure) {
        if (!configure.has('database')) {
            panic({ message: 'Database config not exists or not right!' });
        }
        const { connections } = await configure.get<DbOptions>('database');
        const imports: ModuleMetadata['imports'] = [];
        for (const dbOption of connections) {
            imports.push(TypeOrmModule.forRoot(dbOption as TypeOrmModuleOptions));
        }
        const providers: ModuleMetadata['providers'] = [
            DataExistConstraint,
            UniqueConstraint,
            UniqueExistContraint,
            UniqueTreeConstraint,
            UniqueTreeExistConstraint,
        ];

        return {
            global: true,
            module: DatabaseModule,
            imports,
            providers,
        };
    }

    ...
}
```

#### Meilli模块

在`MeilliService`中传入`meilli`配置，根据连接构建客户端（当然，你也可以直接在`MeilliService`中依赖注入`Configure`来获取配置）

```typescript
// src/modules/meilisearch/melli.module.ts
@Module({})
export class MeilliModule {
    static async forRoot(configure: Configure) {
        if (!configure.has('meilli')) {
            panic({ message: 'Database config not exists or not right!' });
        }
        return {
            global: true,
            module: MeilliModule,
            providers: [
                {
                    provide: MeilliService,
                    useFactory: async () => {
                        const service = new MeilliService(await configure.get('meilli'));
                        service.createClients();
                        return service;
                    },
                },
            ],
            exports: [MeilliService],
        };
    }
}
```

#### 内容模块

还记得我们前面的课程没有把`SanitizeService`在`index.ts`中导出吗？在这里就可以知道为什么这样做了：因为我们需要根据`htmlEnabled`这个配置来确定它是否为一个提供者，如果不需要`html`的文章内容，则不需要加载这个服务！

所以，新的`forRoot`应该是这样

```typescript
// src/modules/content/content.module.ts
@Module({})
export class ContentModule {
    static async forRoot(configure: Configure) {
        const config = await configure.get<ContentConfig>('content', defaultContentConfig);
        ...
        if (config.htmlEnabled) providers.push(SanitizeService);
        if (config.searchType === 'meilli') providers.push(services.SearchService);
        ...
    }
}
```

同时，我们需要修改一下`PostSubscriber`

```typescript
// src/modules/content/subscribers/post.subscriber.ts
@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity = PostEntity;

    constructor(
        protected dataSource: DataSource,
        protected postRepository: PostRepository,
        protected configure: Configure,
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

最后，为了屏蔽报错，修改一下暂时没用到的测试文件

```typescript
// test/app.e2e-spec.ts
describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const configure = new Configure();
        configure.initilize(createData.config.factories, createData.config.storage);
        const BootModule = await createBootModule(configure, {
             modules: createData.modules,
        });
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BootModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    // eslint-disable-next-line jest/expect-expect
    it('/ (GET)', () => {
        return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });
});
```

### 不完美

相对于`@nestjs/config`，我们增加了很多功能，比如`configure`到处使用，不强制依赖注入以及可以存储配置等。但是也有不完美的地方，就是配置验证。因为一般情况下用不到配置验证，所以课程没有添加这个功能。有兴趣的同学可以放在`@nestjs/config`自行添加哦！

## 启动应用

启动应用尝试访问接口，一切正常

![](https://img.pincman.com/media/202310080137233.png)

![](https://img.pincman.com/media/202310080137596.png)
