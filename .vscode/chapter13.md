---
title: 嵌套路由与Swagger文档实现
sidebar_label: 嵌套路由与Swagger文档实现
hide_title: true
sidebar_position: 13
---

## 前置工作

#### 预先阅读

请在学习本节课前预习阅读以下文档

- [Nestjs与Open API(swagger)的结合使用的所有文档](https://docs.nestjs.com/openapi/introduction)
- [Nestjs的Router Module](https://docs.nestjs.com/recipes/router-module#router-module)

#### 依赖模块

`@fastify/static`库使用用于fastify加载静态文件的，因为Open API(Swagger)文档展示静态的html和css文件，所以需要安装此库

```bash
pnpm add @fastify/static
```
#### 改回commonjs

:::tip

如果你使用nestjs默认的**TSC**则可略过此步骤

:::

由于在swc下需要使用swagger插件生成的`metadata.ts`来自动生成注释，而生成的这个文件不支持**esm**，所以我们需要把应用改回只对commonjs的支持

一、把以下两个模块改回老版本

```shell
pnpm add chalk@4 find-up@5
```

二、修改`tsconfig.json`

```json
{
    "compilerOptions": {
        "module": "CommonJS",
        "moduleResolution": "Node",
     ...
}

```

三、删除`.swcrc`

四、修改`package.json`

这是为了防止执行`up --latest`时，这些模板被升级到最新的esm版本

```json
{
    "pnpm": {
        "updateConfig": {
            "ignoreDependencies": [
                "find-up",
                "chalk"
            ]
        }
    }
}

```

修改`find-up`使用方式

```typescript
// src/modules/config/env.ts
import findUp from 'find-up';
export class Env {
    async load() {
        if (isNil(process.env.NODE_ENV)) process.env.NODE_ENV = EnvironmentType.PRODUCTION;
        const search = [findUp.sync(['.env'])];
        if (process.env.NODE_ENV !== EnvironmentType.PRODUCTION) {
            search.push(findUp.sync([`.env.${process.env.NODE_ENV}`]));
        }
      ...
```

修改`chalk`使用方式

```typescript
// src/modules/core/helpers/utils.ts
import chalk from 'chalk';
export async function panic(option: PanicOption | string) {
    console.log();
    if (typeof option === 'string') {
        console.log(chalk.red(`\n❌ ${option}`));
        process.exit(1);
    }
    const { error, message, exit = true } = option;
    !isNil(error) ? console.log(chalk.red(error)) : console.log(chalk.red(`\n❌ ${message}`));
    if (exit) process.exit(1);
}

// src/modules/restful/helpers.ts
import chalk from 'chalk';
export async function echoApi(configure: Configure, container: NestFastifyApplication) {
    const appUrl = await configure.get<string>('app.url');
    // const chalk = (await import('chalk')).default;
    // 设置应用的API前缀,如果没有则与appUrl相同
    const urlPrefix = await configure.get('app.prefix', undefined);
    const apiUrl = !isNil(urlPrefix)
        ? `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`
        : appUrl;
    console.log(`- RestAPI: ${chalk.green.underline(apiUrl)}`);
  ...
  
async function echoApiDocs(name: string, doc: APIDocOption, appUrl: string) {
    const getDocPath = (dpath: string) => `${appUrl}/${dpath}`;
    // const chalk = (await import('chalk')).default;
    if (!doc.routes && doc.default) {
      ...
```

## Restful模块

删除全局路由前缀，因为swagger无法自动读取`prefix`前缀，后面我们通过嵌套路由的方式添加总前缀

```typescript
// src/modules/core/helpers/app.ts
export const createApp = (name: string, options: CreateOptions) => async (): Promise<App> => {
    ...
    // 设置api前缀
    // if (apps[name].configure.has('app.prefix')) {
    //     apps[name].container.setGlobalPrefix(await apps[name].configure.get<string>('app.prefix'));
    // }
}
```

### 控制器依赖

因为使用配置式路由的原理就是为一群控制器生成一个动态的路由模块，然后把这些模块放入Nestjs自带的RouterModule注册，最后生成一个树形的路由列表。而动态生成的路由模块不知道控制器原来是在哪个模块中，需要用到哪些服务的，所以我们需要为控制器存储固定的依赖模块，这样就可以在生成时导入这些模块了
例如，`PostController`原来是在`ContentModule`中的，所以能使用`ContentModule`中的`PostService`等服务，但是自动生成的`PostRouteModule`是无法使用`PostService`的，而新的控制器是放在`PostRouteModule`中的。所以必须在`ContentModule`的`exports`中添加`PostService`，然后为`PostRouteModule`中自动导入`ContentModule`才可以使控制器能注入`PostService`，这就需要我们使用装饰器的**metadata**来存储控制器依赖的模块，以便在导入它的模块中同时导入它依赖的服务的模块
首先定义一个常量用于存储依赖模块

```typescript
// src/modules/restful/constants.ts
export const CONTROLLER_DEPENDS = 'controller_depends';
```
然后添加一个装饰器来存储
```typescript
// src/modules/restful/decorators/depends.decorator.ts
export const Depends = (...depends: Type<any>[]) => SetMetadata(CONTROLLER_DEPENDS, depends ?? []);
```
### 类型
#### Swagger配置
`TagOption`用于自定Swagger的标签配置，与Nestjs的Swagger模块的标签选项配置相对应
`ApiDocSource`用于定义Swagger文档的选项，定义的选项是会逐级合并覆盖的。因为每个路由集的选项会覆盖每个版本的选项，每个版本的选项又会向上覆盖整个模块的配置，它的属性如下

- `title`: 用于指定文档的名称
- `description`: 用于指定文档的描述
- `auth`: 用于指定是否启用Auth守卫验证（后续课程才会使用到）
- `tags`: 用于指定稳定的标签列表
```typescript
// src/modules/restful/types.ts
interface TagOption {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}

export interface ApiDocSource {
    title?: string;
    description?: string;
    auth?: boolean;
    tags?: (string | ApiTagOption)[];
}
```
#### 模块配置
`ApiConfig`就是我们整个路由系统（即`RestfulModule`）的配置，其继承自`ApiDocSource`

```typescript
// src/modules/restful/types.ts
export interface ApiConfig extends ApiDocSource {
    docuri?: string;
    default: string;
    enabled: string[];
    versions: Record<string, VersionOption>;
}
```

- `docuri`: 用于指定Open API的文档前缀，比如`api/docs`
- `default`: 用于指定默认的API版本
- `enabled`: 用于指定启用的版本号列表，其中默认版本无需再加入该数组
- `versions`: 每个API版本的具体配置

#### 版本及路由配置
`VersionOption`是版本配置类型，版本类型继承`ApiDocSource`类型，所以每个版本也可以拥有自己的文档配置，而`routes`则是路由集列表
`RouteOption`是路由集配置，也可以配置自己的Swagger文档选项

- `name`: 用于指定当前路由集的名称
- `path`: 指定当前路由集的路径前缀，由于我们支持嵌套路由，所以这个是总前缀
- `controllers`：指定控制器列表
- `children`: 用于指定嵌套的子路由集
- `doc`: 用于指定路由集的Swagger文档配置
```typescript
// src/modules/restful/types.ts
/**
 * 版本配置
 */
export interface VersionOption extends ApiDocSource {
    routes?: RouteOption[];
}

/**
 * 路由配置
 */
export interface RouteOption {
    name: string;
    path: string;
    controllers: Type<any>[];
    children?: RouteOption[];
    doc?: ApiDocSource;
}
```
#### 自定义文档配置
`SwaggerOption`与`ApiDocOption`则用于设置我们生成后的`docs`属性的类型，用于启动Swagger，后续代码会用到

```typescript
// src/modules/restful/types.ts
/**
 * swagger选项
 */
export interface SwaggerOption extends ApiDocSource {
    version: string;
    path: string;
    // 该文档包含的路由模块
    include: Type<any>[];
}

/**
 * API与swagger整合的选项
 */
export interface ApiDocOption {
    default?: SwaggerOption;
    routes?: { [key: string]: SwaggerOption };
}
```
### 路由配置类
首先我们需要编写一个路由模块的生成类，作用是根据我们传入的配置动态生成嵌套路由模块树供给RouterModule生成路由

- 构造函数接收`configure`实例以获取配置
- `config`方法用于获取当前整个API配置中的某个配置
- `create`方法用于创建路由和Swagger文档，我们在它的子类中编写
```typescript
// src/modules/restful/base.ts
export abstract class BaseRestful {
    constructor(protected configure: Configure) {}
    abstract create(_config: ApiConfig): void;

    /**
     * API配置
     */
    protected config!: ApiConfig;
}
```
#### 属性

- `routes`: 为生成的路由表，类型即为RouterModule的路由表类型
- `default`: 为默认版本号
- `versions`:为启用的版本号
- `modules`: 为自动生成的路由模块

```typescript
 // src/modules/restful/base.ts
export abstract class BaseRestful {
    ...

    /**
     * 路由表
     */
    protected _routes: Routes = [];

    /**
     * 默认API版本号
     */
    protected _default!: string;

    /**
     * 启用的API版本
     */
    protected _versions: string[] = [];

    /**
     * 自动创建的RouteModule
     */
    protected _modules: { [key: string]: Type<any> } = {};
                         
    get routes() {
        return this._routes;
    }

    get default() {
        return this._default;
    }

    get versions() {
        return this._versions;
    }

    get modules() {
        return this._modules;
    }
}
```
#### 生成基本配置
通过过滤，判断，合并对原来的API配置进行一定的处理生成一个新的配置
首先添加用于清理路由，添加路由前缀和生成URL的两个辅助函数函数

```typescript
// src/modules/restful/helpers.ts
/**
 * 路由路径前缀处理
 * @param routePath
 * @param addPrefix
 */
export const trimPath = (routePath: string, addPrefix = true) =>
    `${addPrefix ? '/' : ''}${trim(routePath.replace('//', '/'), '/')}`;

/**
 * 遍历路由及其子孙路由以清理路径前缀
 * @param data
 */
export const getCleanRoutes = (data: RouteOption[]): RouteOption[] =>
    data.map((option) => {
        const route: RouteOption = {
            ...omit(option, 'children'),
            path: trimPath(option.path),
        };
        if (option.children && option.children.length > 0) {
            route.children = getCleanRoutes(option.children);
        } else {
            delete route.children;
        }
        return route;
    });
```
编写配置生成方法
```typescript
// src/modules/restful/base.ts
export abstract class BaseRestful {
    ...
     /**
     * 创建配置
     * @param config
     */
    protected createConfig(config: ApiConfig) {
        if (!config.default) {
            throw new Error('default api version name should been config!');
        }
        const versionMaps = Object.entries(config.versions)
            // 过滤启用的版本
            .filter(([name]) => {
                if (config.default === name) return true;
                return config.enabled.includes(name);
            })
            // 合并版本配置与总配置
            .map(([name, version]) => [
                name,
                {
                    ...pick(config, ['title', 'description', 'auth']),
                    ...version,
                    tags: Array.from(new Set([...(config.tags ?? []), ...(version.tags ?? [])])),
                    routes: getCleanRoutes(version.routes ?? []),
                },
            ]);

        config.versions = Object.fromEntries(versionMaps);
        // 设置所有版本号
        this._versions = Object.keys(config.versions);
        // 设置默认版本号
        this._default = config.default;
        // 启用的版本中必须包含默认版本
        if (!this._versions.includes(this._default)) {
            throw new Error(`Default api version named ${this._default} not exists!`);
        }
        this.config = config;
    }
}
```
#### 路由模块树
遍历每个版本，根据它们的路由列表使用`createRouteModuleTree`生成嵌套的路由模块树，同时额外地，生一套不带版本前缀的默认版本模块树

:::info

`genRoutePath`函数用于生成准确的最终路由路径

:::

```typescript
// src/modules/restful/helpers.ts
/**
 * 生成最终路由路径(为路由路径添加自定义及版本前缀)
 * @param routePath
 * @param version
 */
export const genRoutePath = (routePath: string, prefix?: string, version?: string) => {
    const addVersion = `${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`;
    return isNil(prefix) ? trimPath(addVersion) : trimPath(`${prefix}${addVersion}`);
};

// src/modules/restful/base.ts
export abstract class BaseRestful {
      ...
         /**
     * 创建路由树及路由模块
     */
    protected async createRoutes() {
        const prefix = await this.configure.get<string>('app.prefix');
        const versionMaps = Object.entries(this.config.versions);

        // 对每个版本的路由使用'resolveRoutes'方法进行处理
        this._routes = (
            await Promise.all(
                versionMaps.map(async ([name, version]) =>
                    (
                        await createRouteModuleTree(
                            this.configure,
                            this._modules,
                            version.routes ?? [],
                            name,
                        )
                    ).map((route) => ({
                        ...route,
                        path: genRoutePath(route.path, prefix, name),
                    })),
                ),
            )
        ).reduce((o, n) => [...o, ...n], []);
        // 生成一个默认省略版本号的路由
        const defaultVersion = this.config.versions[this._default];
        this._routes = [
            ...this._routes,
            ...(
                await createRouteModuleTree(
                    this.configure,
                    this._modules,
                    defaultVersion.routes ?? [],
                )
            ).map((route) => ({
                ...route,
                path: genRoutePath(route.path, prefix),
            })),
        ];
    }
}
```
`createRouteModuleTree`函数
此函数用于构建路由模块，其逻辑如下

1. 根据生成路由模块名称对应的key，key值为`{父模块名}.{当前的路由集名}`
2. 判断模块名是否唯一
6. 把每个控制器的依赖模块导入到生成的路由模块
7. 生成路由模块，模块的类名使用首字母大写的驼峰命名
8. 把生成的模块放入模块列表，这是为了循环和递归时进行对比，防止路由模块重名（注意，此参数与`BaseRestful`类的对象的`_modules`属性绑定）
9. 如果有子路由集，则递归执行
10. 最后返回路由树
```typescript
// src/modules/restful/helpers.ts
export const createRouteModuleTree = (
    configure: Configure,
    modules: { [key: string]: Type<any> },
    routes: RouteOption[],
    parentModule?: string,
): Promise<Routes> =>
    Promise.all(
        routes.map(async ({ name, path, children, controllers, doc }) => {
            // 自动创建路由模块的名称
            const moduleName = parentModule ? `${parentModule}.${name}` : name;
            // RouteModule的名称必须唯一
            if (Object.keys(modules).includes(moduleName)) {
                throw new Error('route name should be unique in same level!');
            }
            // 获取每个控制器的依赖模块
            const depends = controllers
                .map((c) => Reflect.getMetadata(CONTROLLER_DEPENDS, c) || [])
                .reduce((o: Type<any>[], n) => [...o, ...n], [])
                .reduce((o: Type<any>[], n: Type<any>) => {
                    if (o.find((i) => i === n)) return o;
                    return [...o, n];
                }, []);
            // 为每个没有自己添加`ApiTags`装饰器的控制器添加Tag
            if (doc?.tags && doc.tags.length > 0) {
                controllers.forEach((controller) => {
                    !Reflect.getMetadata('swagger/apiUseTags', controller) &&
                        ApiTags(
                            ...doc.tags.map((tag) => (typeof tag === 'string' ? tag : tag.name))!,
                        )(controller);
                });
            }
            // 创建路由模块,并导入所有控制器的依赖模块
            const module = CreateModule(`${upperFirst(camelCase(name))}RouteModule`, () => ({
                controllers,
                imports: depends,
            }));
            // 在modules变量中追加创建的RouteModule,防止重名
            modules[moduleName] = module;
            const route: RouteTree = { path, module };
            // 如果有子路由则进一步处理
            if (children)
                route.children = await createRouteModuleTree(
                    configure,
                    modules,
                    children,
                    moduleName,
                );
            return route;
        }),
    );

```
#### 获取路由模块
这个方法用于获取一个树形模块集下的所有已经生成的路由模块，并通过递归的方式获取其子路集映射的模块列表
```typescript
// src/modules/restful/base.ts
export abstract class BaseRestful {
  ...
   /**
     * 获取一个路由列表下的所有路由模块(路由模块是手动创建的动态模块)
     * @param routes
     * @param parent
     */
    protected getRouteModules(routes: RouteOption[], parent?: string) {
        const result = routes
            .map(({ name, children }) => {
                const routeName = parent ? `${parent}.${name}` : name;
                let modules: Type<any>[] = [this._modules[routeName]];
                if (children) modules = [...modules, ...this.getRouteModules(children, routeName)];
                return modules;
            })
            .reduce((o, n) => [...o, ...n], [])
            .filter((i) => !!i);
        return result;
    }
}
```
### 文档配置类
这个类继承自`BaseRestful`，前者用于添加生成路由树和路由模块树的方法，此类用于生成Swagger文档

- `create`方法用于创建配置，创建路由树和路由模块树，已经创建Swagger文档的配置
- `getModuleImports`方法用于获取所有需要导入到`RestfulModule`的路由模块，以及`RouterModule`
```typescript
// src/modules/restful/restful.ts
@Injectable()
export class Restful extends BaseRestful {
    async create(config: ApiConfig) {
        this.createConfig(config);
        await this.createRoutes();
        this.createDocs();
    }
  
    getModuleImports() {
        return [...Object.values(this.modules), RouterModule.register(this.routes)];
    }
}
```
#### 属性

- `_docs`使用存储每个版本的键值对映射的文档选项
- `excludeVersionModules`用于在生成文档选项时排除已经添加到文档的模块
```typescript
// src/modules/restful/restful.ts
export class Restful extends BaseRestful {
    ...
    protected _docs!: {
        [version: string]: ApiDocOption;
    };

    /**
     * 排除已经添加的模块
     */
    protected excludeVersionModules: string[] = [];

    get docs() {
        return this._docs;
    }
} 
```
#### 生成路由文档

首先添加一个函数用于生成最终文档路径

```typescript
/**
 * 生成最终文档路径
 * @param routePath
 * @param prefix
 * @param version
 */
export const genDocPath = (routePath: string, prefix?: string, version?: string) =>
    trimPath(`${prefix}${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`, false);
```

`getRouteDocs`函数用于生成每个路由列表的文档配置，逻辑如下

1. 通过合并覆盖父级获得文档信息
2. `include`包含当前路由集的路由模块
3. 遍历该路由集下的所有路由
4. 排除已经添加到`include`的路由模块
5. 获取当前路由下的自定义的文档配置并合并覆盖上级
6. 如果有子路由集则递归添加
7. 返回路由文档
```typescript
// src/modules/restful/restful.ts    
export class Restful extends BaseRestful {
  ...
   /**
     * 生成路由文档
     * @param option
     * @param routes
     * @param parent
     */
    protected getRouteDocs(
        option: Omit<SwaggerOption, 'include'>,
        routes: RouteOption[],
        parent?: string,
    ): { [key: string]: SwaggerOption } {
        /**
         * 合并Doc配置
         *
         * @param {Omit<SwaggerOption, 'include'>} vDoc
         * @param {RouteOption} route
         */
        const mergeDoc = (vDoc: Omit<SwaggerOption, 'include'>, route: RouteOption) => ({
            ...vDoc,
            ...route.doc,
            tags: Array.from(new Set([...(vDoc.tags ?? []), ...(route.doc?.tags ?? [])])),
            path: genDocPath(route.path, this.config.docuri, parent),
            include: this.getRouteModules([route], parent),
        });
        let routeDocs: { [key: string]: SwaggerOption } = {};

        // 判断路由是否有除tags之外的其它doc属性
        const hasAdditional = (doc?: ApiDocSource) =>
            doc && Object.keys(omit(doc, 'tags')).length > 0;

        for (const route of routes) {
            const { name, doc, children } = route;
            const moduleName = parent ? `${parent}.${name}` : name;

            // 加入在版本DOC中排除模块列表
            if (hasAdditional(doc) || parent) this.excludeVersionModules.push(moduleName);

            // 添加到routeDocs中
            if (hasAdditional(doc)) {
                routeDocs[moduleName.replace(`${option.version}.`, '')] = mergeDoc(option, route);
            }
            if (children) {
                routeDocs = {
                    ...routeDocs,
                    ...this.getRouteDocs(option, children, moduleName),
                };
            }
        }
        return routeDocs;
    }
}
```
#### 生成版本文档
首先排除已经添加到文档的`include`中的模块
```typescript
// src/modules/restful/restful.ts    
export class Restful extends BaseRestful {
    ...
    /**
     * 排除已经添加的模块
     * @param routeModules
     */
    protected filterExcludeModules(routeModules: Type<any>[]) {
        const excludeModules: Type<any>[] = [];
        const excludeNames = Array.from(new Set(this.excludeVersionModules));
        for (const [name, module] of Object.entries(this._modules)) {
            if (excludeNames.includes(name)) excludeModules.push(module);
        }
        return routeModules.filter(
            (rmodule) => !excludeModules.find((emodule) => emodule === rmodule),
        );
    }
}
```
通过`getDocOption`方法来生成每个版本的文档配置
逻辑为

1. 根据版本的文档配置设置一个默认的文档配置
2. 获取版本的路由集的Swagger配置
3. 过滤掉已经添加到`include`的路由模块
4. 如果还有多余的模块或者在没有当路由没文档的情况下，把`include`添加到选项中
5. 返回文档的版本配置
```typescript
// src/modules/restful/restful.ts
export class Restful extends BaseRestful {
    ...
    /**
     * 生成版本文档配置
     * @param name
     * @param voption
     * @param isDefault
     */
    protected getDocOption(name: string, voption: VersionOption, isDefault = false) {
        const docConfig: APIDocOption = {};
        // 默认文档配置
        const defaultDoc = {
            title: voption.title!,
            description: voption.description!,
            tags: voption.tags ?? [],
            auth: voption.auth ?? false,
            version: name,
            path: trim(`${this.config.docuri}${isDefault ? '' : `/${name}`}`, '/'),
        };
        // 获取路由文档
        const routesDoc = isDefault
            ? this.getRouteDocs(defaultDoc, voption.routes ?? [])
            : this.getRouteDocs(defaultDoc, voption.routes ?? [], name);
        if (Object.keys(routesDoc).length > 0) {
            docConfig.routes = routesDoc;
        }
        const routeModules = isDefault
            ? this.getRouteModules(voption.routes ?? [])
            : this.getRouteModules(voption.routes ?? [], name);
        // 文档所依赖的模块
        const include = this.filterExcludeModules(routeModules);
        // 版本DOC中有依赖的路由模块或者版本DOC中没有路由DOC则添加版本默认DOC
        if (include.length > 0 || !docConfig.routes) {
            docConfig.default = { ...defaultDoc, include };
        }
        return docConfig;
    }
}
```
#### 创建文档配置
遍历所有版本，为每个API版本添加文档配置，并且增加一个默认版本的文档配置
```typescript
// src/modules/restful/restful.ts    
export class Restful extends BaseRestful {
   ...
    /**
     * 创建文档配置
     */
    protected createDocs() {
        const versionMaps = Object.entries(this.config.versions);
        const vDocs = versionMaps.map(([name, version]) => [
            name,
            this.getDocOption(name, version),
        ]);
        this._docs = Object.fromEntries(vDocs);
        const defaultVersion = this.config.versions[this._default];
        // 为默认版本再次生成一个文档
        this._docs.default = this.getDocOption(this._default, defaultVersion, true);
    }
}
```
#### 构建Open API
根据每个版本的文档配置启动多个Swagger应用![image-20231012050836440](/Users/pincman/Library/Application Support/typora-user-images/image-20231012050836440.png)
```typescript
// src/modules/restful/restful.ts
export class Restful extends BaseRestful {
    ...
    /**
     * 构建Open API
     * @param app
     */
    factoryDocs<T extends INestApplication>(container: T) {
        const docs = Object.values(this._docs)
            .map((vdoc) => [vdoc.default, ...Object.values(vdoc.routes ?? {})])
            .reduce((o, n) => [...o, ...n], [])
            .filter((i) => !!i);
        for (const voption of docs) {
            const { title, description, version, auth, include, tags } = voption!;
            const builder = new DocumentBuilder();
            if (title) builder.setTitle(title);
            if (description) builder.setDescription(description);
            if (auth) builder.addBearerAuth();
            if (tags) {
                tags.forEach((tag) =>
                    typeof tag === 'string'
                        ? builder.addTag(tag)
                        : builder.addTag(tag.name, tag.description, tag.externalDocs),
                );
            }
            builder.setVersion(version);
            const document = SwaggerModule.createDocument(container, builder.build(), {
                include: include.length > 0 ? include : [() => undefined as any],
                ignoreGlobalPrefix: true,
                deepScanRoutes: true,
            });
            SwaggerModule.setup(voption!.path, container, document);
        }
    }
}
```
### 创建模块
编写一个Restful模块，用于导入路由模块以及设置`Restful`这个提供者
```typescript
// src/modules/restful/restful.module.ts
@Module({})
export class RestfulModule {
    static async forRoot(configure: Configure) {
        const restful = new Restful(configure);
        await restful.create(await configure.get('api'));
        return {
            module: RestfulModule,
            global: true,
            imports: restful.getModuleImports(),
            providers: [
                {
                    provide: Restful,
                    useValue: restful,
                },
            ],
            exports: [Restful],
        };
    }
}
```
### 端口打印
添加两个函数，分别用于根据生成的配置来打印API和DOC的URL，其中`echoApi`调用`echoDcos`
```typescript
// src/modules/restful/helpers.ts
/**
 * 输出API和DOC地址
 * @param factory
 */
export async function echoApi(configure: Configure, container: NestFastifyApplication) {
    const appUrl = await configure.get<string>('app.url');
    const chalk = (await import('chalk')).default;
    // 设置应用的API前缀,如果没有则与appUrl相同
    const urlPrefix = await configure.get('app.prefix', undefined);
    const apiUrl = !isNil(urlPrefix)
        ? `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`
        : appUrl;
    console.log(`- RestAPI: ${chalk.green.underline(apiUrl)}`);
    console.log('- RestDocs:');
    const factory = container.get(Restful);
    const { default: defaultDoc, ...docs } = factory.docs;
    await echoApiDocs('default', defaultDoc, appUrl);
    for (const [name, doc] of Object.entries(docs)) {
        console.log();
        echoApiDocs(name, doc, appUrl);
    }
}

/**
 * 输出一个版本的API和DOC地址
 * @param name
 * @param doc
 * @param appUrl
 */
async function echoApiDocs(name: string, doc: ApiDocOption, appUrl: string) {
    const getDocPath = (dpath: string) => `${appUrl}/${dpath}`;
    const chalk = (await import('chalk')).default;
    if (!doc.routes && doc.default) {
        console.log(
            `    [${chalk.blue(name.toUpperCase())}]: ${chalk.green.underline(
                getDocPath(doc.default.path),
            )}`,
        );
        return;
    }
    console.log(`    [${chalk.blue(name.toUpperCase())}]:`);
    if (doc.default) {
        console.log(`      default: ${chalk.green.underline(getDocPath(doc.default.path))}`);
    }
    if (doc.routes) {
        Object.entries(doc.routes).forEach(([_routeName, rdocs]) => {
            console.log(
                `      <${chalk.yellowBright.bold(rdocs.title)}>: ${chalk.green.underline(
                    getDocPath(rdocs.path),
                )}`,
            );
        });
    }
}
```
## 更新应用
所有准备工作都做好了，接下来我们就来更改应用，实现配置式路由和Swagger整合的美妙吧
### 内容模块
删除内容模块中原来导入的`controllers`
```typescript
// src/modules/content/content.module.ts
@Module({})
export class ContentModule {
    static async forRoot(configure: Configure) {
        ...
        return {
            module: ContentModule,
            imports: [
                TypeOrmModule.forFeature(Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            // controllers: Object.values(controllers),
            providers,
            exports: [
                ...Object.values(services),
                PostService,
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
        };
    }
}

```

### 路由配置

版本路由配置
```typescript
// src/config/api.config/v1.ts
import { Configure } from '@/modules/config/configure';
import * as contentControllers from '@/modules/content/controllers';
import { VersionOption } from '@/modules/restful/types';

export const v1 = async (configure: Configure): Promise<VersionOption> => ({
    routes: [
        {
            name: 'app',
            path: '/',
            controllers: [],
            doc: {
                title: '应用接口',
                description: '前端APP应用接口',
                tags: [
                    { name: '分类操作', description: '对分类的增删查操作' },
                    { name: '标签操作', description: '对标签的增删查操作' },
                    { name: '文章操作', description: '对文章进行的增删查改及搜索等操作' },
                    { name: '评论操作', description: '对评论的增删查操作' },
                ],
            },
            children: [
                {
                    name: 'content',
                    path: 'content',
                    controllers: Object.values(contentControllers),
                },
            ],
        },
    ],
});
```

API配置

```typescript
// src/config/api.config/index.ts
import { v1 } from './v1';

export const api: ConfigureFactory<ApiConfig> = {
    register: async (configure: Configure) => ({
        title: configure.env.get('API_TITLE', '3R教室'),
        description: configure.env.get('API_DESCRIPTION', '3R教室TS全栈开发教程'),
        auth: true,
        docuri: 'api/docs',
        default: configure.env.get('API_DEFAULT_VERSION', 'v1'),
        enabled: [],
        versions: { v1: await v1(configure) },
    }),
};
```
在`configs/index.ts`中使用`export * from './api.config';`加入配置
### 加载模块
与数据库等核心模块一样，可以根据是否传入`api`配置来自动导入`RestfulModule`以及启动Swagger文档

```typescript
// src/constants.ts
export const createData: CreateOptions = {
    config: { factories: configs, storage: { enabled: true } },
    imports: async (configure) => [
        DatabaseModule.forRoot(configure),
        MeilliModule.forRoot(configure),
        RestfulModule.forRoot(configure),
        ContentModule.forRoot(configure),
    ],
    globals: {},
    builder: async ({ configure, BootModule }) => {
        const container = await NestFactory.create<NestFastifyApplication>(
            BootModule,
            new FastifyAdapter(),
            {
                cors: true,
                logger: ['error', 'warn'],
            },
        );
        const restful = container.get(Restful);
        await restful.factoryDocs(container)
        return container;
    },
};
```

### 更改输出

```typescript
// src/main.ts
startApp(createApp(WEBAPP, createData), ({ configure, container }) => async () => {
    console.log();
    echoApi(configure, container);
});
```
启动应用后可以看到显示Swagger地址

![](https://img.pincman.com/media/202310131158080.png)

### Swagger注释

这里介绍一些常用的用于装饰文档的swagger装饰器，其他装饰请自行查看[文档](https://docs.nestjs.com/openapi/operations)

#### 控制器装饰器

- 使用`@ApiTags`装饰器为每个控制器添加标签
- 使用`@ApiOperation`为每个操作添加一个API注释

例如：

```typescript
// src/modules/content/controllers/category.controller.ts
@ApiTags('分类操作')
@Depends(ContentModule)
@Controller('categories')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    @ApiOperation({ summary: '查询分类树' })
    async tree(@Query() options: QueryCategoryTreeDto) {
        return this.service.findTrees(options);
    }

    @Get()
    @SerializeOptions({ groups: ['category-list'] })
    @ApiOperation({ summary: '分页查询分类列表' })
    async list(
        @Query()
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    @ApiOperation({ summary: '分页详解查询' })
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }
    ...
}
```

![](https://img.pincman.com/media/202310120611352.png)

#### DTO装饰器

- `@ApiProperty`装饰必选属性
- `@ApiPropertyOptional`装饰可选属性

例如: 

```typescript
// src/modules/content/dtos/post.dto.ts
@DtoValidation({ groups: ['create'] })
export class CreatePostDto {
    @ApiProperty({ description: '文章标题', maxLength: 255 })
    @MaxLength(255, {
        always: true,
        message: '文章标题长度最大为$constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: '文章标题必须填写' })
    @IsOptional({ groups: ['update'] })
    title: string;

    @ApiPropertyOptional({
        description: '文章描述',
        maxLength: 500,
    })
    @MaxLength(500, {
        always: true,
        message: '文章描述长度最大为$constraint1',
    })
    @IsOptional({ always: true })
    summary?: string;
  ...
}
```

![](https://img.pincman.com/media/202310120609569.png)

#### CLI插件

使用装饰器的方式添加文档注释使得重复性代码太多，枯燥乏味。我们可以利用nestjs的[swagger cli插件](https://docs.nestjs.com/openapi/cli-plugin)来自动生成这些注释

:::info

由于swc使用该插件会生成一个`metadata.ts`用来存放swagger模块，所以需要修改一下`factoryDocs`并通过`SwaggerModule.loadPluginMetadata`加载这些数据，而tsc则不需要也不会生成`metadata.ts`，配置好插件即可使用

:::

```typescript
// src/modules/restful/restful.ts   
@Injectable()
export class Restful extends BaseRestful {
   ...
   async factoryDocs<T extends INestApplication>(
        container: T,
        metadata?: () => Promise<Record<string, any>>,
    ) {
        ...
            builder.setVersion(version);
            if (!isNil(metadata)) await SwaggerModule.loadPluginMetadata(metadata);
            const document = SwaggerModule.createDocument(container, builder.build(), {
                include: include.length > 0 ? include : [() => undefined as any],
                // 忽略全局路由前缀
                ignoreGlobalPrefix: true,
                // 嵌套路由模块扫码(可选)
                deepScanRoutes: true,
            });
            SwaggerModule.setup(voption!.path, container, document);
        }
    }
}
```

然后修改一下`createData`导入`metadata`. `metadata`现在是不存在的，但待会儿会自动生成，所以不用管报错

:::tip

注意：如果你使用tsc而不是swc，就不需要这一步了

:::

```typescript
// src/constants.ts
/* eslint-disable global-require */

export const createData: CreateOptions = {
    ...
    builder: async ({ configure, BootModule }) => {
        const container = await NestFactory.create<NestFastifyApplication>(
            BootModule,
            new FastifyAdapter(),
            {
                cors: true,
                logger: ['error', 'warn'],
            },
        );
        if (!isNil(await configure.get<ApiConfig>('api', null))) {
            const restful = container.get(Restful);
            /**
             * 判断是否存在metadata模块,存在的话则加载并传入factoryDocs
             */
            let metadata: () => Promise<Record<string, any>>;
            if (existsSync(join(__dirname, 'metadata.js'))) {
                metadata = require(join(__dirname, 'metadata.js')).default;
            }
            if (existsSync(join(__dirname, 'metadata.ts'))) {
                metadata = require(join(__dirname, 'metadata.ts')).default;
            }
            await restful.factoryDocs(container, metadata);
        }
        return container;
    },
};
```

修改`nest-cli.json`启用插件

```json
{
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
        "deleteOutDir": true,
        "builder": "swc",
        "typeCheck": true,
        "plugins": [
            {
                "name": "@nestjs/swagger",
                "options": {
                    "introspectComments": true,
                    "controllerKeyOfComment": "summary"
                }
            }
        ]
    }
}
```

现在，我们给所有的控制器方法添加上注释，看一下文档是否能正常显示

:::note

此处以`CategoryController`为例，其他的请自行添加注释

:::

```typescript
// src/modules/content/controllers/category.controller.ts
@ApiTags('分类操作')
@Depends(ContentModule)
@Controller('categories')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    /**
     * 查询分类树
     * @param options
     */
    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    async tree(@Query() options: QueryCategoryTreeDto) {
        return this.service.findTrees(options);
    }

    /**
     * 分页查询分类列表
     * @param options
     */
    @Get()
    @SerializeOptions({ groups: ['category-list'] })
    async list(
        @Query()
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 分页详解查询
     * @param id
     */
    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    /**
     * 新增分类
     * @param data
     */
    @Post()
    @SerializeOptions({ groups: ['category-detail'] })
    async store(
        @Body()
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    /**
     * 更新分类
     * @param data
     */
    @Patch()
    @SerializeOptions({ groups: ['category-detail'] })
    async update(
        @Body()
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }

    /**
     * 批量删除分类
     * @param data
     */
    @Delete()
    @SerializeOptions({ groups: ['category-list'] })
    async delete(
        @Body()
        data: DeleteWithTrashDto,
    ) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    /**
     * 批量恢复分类
     * @param data
     */
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

![](https://img.pincman.com/media/202310120647846.png)

接下来给DTO也添加上注释（**CLI会根据释来自动生成`@ApiProperty`与` @ApiPropertyOptional`装饰器**）

- 添加一个`PaginateDto`，用于分页数据查询的基础验证，并给几个公共DTO添加注释
- 添加一个`PaginateWithTrashedDto`，在`PaginateDto`的基础上添加软删除查询验证
- 取消`DeleteDto`和`RestoreDto`的`ids`属性默认值，防止debug报错

:::caution

注意：必须要给`page`和`limit`加上类型，否则无法根据数据生成文档注释

:::

:::info

现在`queryCategoryDto`和`QueryTagDto`已经没用了，删除即可.然后在服务类和控制器中报错的地方把DTO改成`queryCategoryDto`和`QueryTagDto`

:::

```typescript
// src/modules/restful/dtos/paginate.dto.ts
@DtoValidation({ type: 'query' })
export class PaginateDto implements PaginateOptions {
    /**
     * 当前页
     */
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page?: number = 1;

    /**
     * 每页数据量
     */
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit?: number = 10;
}

// src/modules/restful/dtos/delete.dto.ts
@DtoValidation()
export class DeleteDto {
    /**
     * 待删除数据的ID列表
     */
    ...
    ids: string[];
}

// src/modules/restful/dtos/delete-with-trash.dto.ts
@DtoValidation()
export class DeleteWithTrashDto extends DeleteDto {
    /**
     * 是否软删除
     */
    ...
    trash?: boolean;
}

// src/modules/restful/dtos/delete-with-trash.dto.ts
@DtoValidation()
export class RestoreDto {
    /**
     * 待恢复数据的ID列表
     */
    ...
    ids: string[];
}

// src/modules/restful/dtos/index.ts
export * from './delete.dto';
export * from './delete-with-trash.dto';
export * from './paginate.dto';
```

给一些么没进常量添加注释，这样会在文档自动显示

```typescript
// src/modules/database/constants.ts
/**
 * 软删除数据查询类型
 */
export enum SelectTrashMode {
    /**
     * 全部数据
     */
    ALL = 'all',
    /**
     * 只查询回收站中的
     */
    ONLY = 'only',
    /**
     * 只查询没有被软删除的
     */
    NONE = 'none',
}

/**
 * 文章排序类型
 */
export enum PostOrderType {
    /**
     * 最新创建
     */
    CREATED = 'createdAt',
    /**
     * 最近更新
     */
    UPDATED = 'updatedAt',
    /**
     * 最新发布
     */
    PUBLISHED = 'publishedAt',
    /**
     * 评论数量
     */
    COMMENTCOUNT = 'commentCount',
    /**
     * 自定义排序
     */
    CUSTOM = 'custom',

```

添加内容模块中的验证注释，此处以`QueryPostDto`为例，其它的请参照代码仓库修改

```typescript
// src/modules/content/dtos/post.dto.ts
@DtoValidation({ type: 'query' })
export class QueryPostDto extends PaginateWithTrashedDto {
    /**
     * 全文搜索
     */
    @MaxLength(100, {
        always: true,
        message: '搜索字符串长度不得超过$constraint1',
    })
    @IsOptional({ always: true })
    search?: string;

    /**
     * 是否查询已发布(全部文章:不填、只查询已发布的:true、只查询未发布的:false)
     */
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    /**
     * 查询结果排序,不填则综合排序
     */
    @IsEnum(PostOrderType, {
        message: `排序规则必须是${Object.values(PostOrderType).join(',')}其中一项`,
    })
    @IsOptional()
    orderBy?: PostOrderType;

    /**
     * 根据分类ID查询此分类及其后代分类下的文章
     */
    @IsDataExist(CategoryEntity, {
        always: true,
        message: '分类不存在',
    })
    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    category?: string;

    /**
     * 根据管理标签ID查询
     */
    @IsDataExist(TagEntity, {
        always: true,
        message: '标签不存在',
    })
    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    tag?: string;
}
```

### 使用文档

学完这一节后我们在测试api的时候（没学到E2E测试之前），可以很方便的使用Insomnia导入测试了
只要在Insomnia的中Create一个新的Design，然后导入你的API文档地址+json（比如`http://127.0.0.1:3100/api/docs/v1-json`或`http://127.0.0.1:3100/api/docs-json`）即可获取所有的API进行测试，而且API变动后重新导入即可覆盖更新

:::info

从这一节开始课程不再提供`insomnia.json`文件，自行导入swagger即可(接口有更新请重新导入一下，这个不会自动更新)。就如后面的数据迁移和填充后我们可以自行一行命令生成数据结构和模拟数据

:::

具体按下图进行操作

![](https://img.pincman.com/media/202310131221238.png)

![](https://img.pincman.com/media/202310131225918.png)

![](https://img.pincman.com/media/202310131254082.png)

![](https://img.pincman.com/media/202310131256483.png)

![](https://img.pincman.com/media/202310131300547.png)

![](https://img.pincman.com/media/202310131301575.png)
