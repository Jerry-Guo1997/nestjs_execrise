使用ElasticSearch及Mysql两种方式实现全文搜索
> 关于ElasticSearch的使用方法，可以查看[这个](https://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)，但是他的版本有些老，结合着[官网文档](https://www.elastic.co/guide/en/welcome-to-elastic/current/getting-started-guides.html)看比较好

## 学习目标

- 使用Mysql的`like`实现全文搜索
- 使用Mysql的`against`实现全文搜索
- 使用ElasiticSearch实现全文搜索
## ElasticSearch安装
> 目前Linux与Windows安装，大家按照[ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/8.6/deb.html)官方的方法来即可，MacOS下使用如下方式安装

### 下载
```typescript
~ cd ~/Code
~ curl -O https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.6.1-darwin-x86_64.tar.gz
~ tar -zxvf elasticsearch-8.6.1-darwin-x86_64.tar.gz && mv elasticsearch-8.6.1 elastic
```
### 配置与启动
因为我们是本地开发使用，所以用不到密码,SSL这些安全设置，也不需要用到多节点集群，为简单起见，我们使用最简配置
首先把配置文件中的其它配置全部注释掉，然后添加以下配置
```shell
# ~/config/elasticsearch.yml

# 其它配置
#----------------------- END SECURITY AUTO CONFIGURATION -------------------------

network.host: 0.0.0.0
http.port: 9200
xpack.security.enabled: false
xpack.security.enrollment.enabled: false
xpack.security.http.ssl.enabled: false
xpack.security.transport.ssl.enabled: false
xpack.security.http.ssl.keystore.secure_password: false
xpack.security.transport.ssl.keystore.secure_password: false
cluster.initial_master_nodes: ["local"]
```
尝试启动
```shell
~ cd ~/Code/elastic && ./bin/elasticsearch
```
访问`http://localhost:9200`，如果可以访问证明安装成功
### 开机启动
运行`code ~/Library/LaunchAgents/io.elasticsearch.plist`，存入以下内容并保存，重启后再次访问`http://localhost:9200`，查看是否正常
> 注意把`pincman`换成你的系统用户名

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>KeepAlive</key>
    <true/>
    <key>Label</key>
    <string>io.elasticsearch</string>
    <key>ProgramArguments</key>
    <array>
      <string>/Users/pincman/elastic/bin/elasticsearch</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
      <key>ES_JAVA_OPTS</key>
      <string>-Xms512m -Xmx512m</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/pincman/elastic</string>
    <key>StandardErrorPath</key>
    <string>/Users/pincman/logs/elasticsearch.log</string>
    <key>StandardOutPath</key>
    <string>/Users/pincman/elastic/logs/elasticsearch.log</string>
  </dict>
</plist>
```
### 关于Kibana
在生产环境下还可以安装一个kibana，这时一个管理ElasticSearch的web面板，安装非常简单，可以查看[这里](https://www.elastic.co/guide/en/kibana/8.6/deb.html)
![202302010752133.png](https://cdn.nlark.com/yuque/0/2023/png/309347/1676989751672-515379d4-99e2-412d-a661-6039cf586b5b.png#averageHue=%231aa1c3&clientId=u83104e58-bdda-4&from=ui&id=uc0282310&originHeight=1888&originWidth=2940&originalType=binary&ratio=1.5625&rotation=0&showTitle=false&size=468539&status=done&style=none&taskId=u9cab43ab-5db2-4301-869d-5e8e04b22d4&title=)
## 代码编写
这一节课的文件结构不大，就不专门列出来了，我们直接开始编码
### 添加内容模块配置
为了我们可以根据配置随时调整全文搜索方式，需要为内容模块添加一个配置
首先定义全文搜索模式的类型

- `like`代表使用传统的mysql`like`关键字实现全文搜索
- `against`代表使用mysql的`against`实现
```typescript
// src/modules/content/types.ts
export type SearchType = 'like' | 'against' | 'elastic';
```
加一个`ContentModule`的配置类型
```typescript
// src/modules/content/types.ts
export interface ContentConfig {
    searchType?: SearchType;
}
```
然后添加一个`content`配置
```typescript
// src/config/content.config.ts
export const content = (): ContentConfig => ({
    searchType: 'against',
});
```
这个配置的具体作用，我们在最后部分具体叙述！
### 整合ElasticSearch
首先安装以下类库

- `@elastic/elasticsearch`是一个ElasticSearch的
- `@nestjs/elasticsearch`是nestjs整合`@elastic/elasticsearchs`的三方模块
```typescript
~ pnpm add @elastic/elasticsearch @nestjs/elasticsearch
```
添加一个配置函数用于连接`elastic`
```typescript
// src/config/elastic.config.ts
import { ElasticsearchModuleOptions } from '@nestjs/elasticsearch';

export const elastic = (): ElasticsearchModuleOptions => ({
    node: 'http://localhost:9200',
    maxRetries: 10,
    requestTimeout: 60000,
    pingTimeout: 60000,
    sniffOnStart: true,
});
```
创建一个`ElasticModule`，在该模块中使用`@nestjs/elasticsearch`通过`@elastic/elasticsearch`连接ElasticSearch，它接受一个配置函数用于生成配置，生成配置后传入`ElasticsearchModule.register`来连接ElasticSearch，最后为了在其它模块中使用`@nestjs/elasticsearch`导出的`ElasticsearchService`来查询和操作数据，我们需要把`@nestjs/elasticsearch`的`ElasticsearchModule`给导出来（**注意，这里需要直接导出模块，而不是**`**ElasticsearchService**`）
> 为了方便其它模块使用，与`DatabaseModule`一样，把`ElasticModule`设置成全局模块

```typescript
// src/modules/elastic/elastic.module.ts
@Module({})
export class ElasticModule {
    static forRoot(configRegister: () => ElasticsearchModuleOptions): DynamicModule {
        return {
            global: true,
            module: ElasticModule,
            imports: [ElasticsearchModule.register(configRegister())],
            exports: [ElasticsearchModule],
        };
    }
}
```
注册模块
```typescript
// src/app.module.ts
@Module({
    imports: [DatabaseModule.forRoot(database),ElasticModule.forRoot(elastic), ContentModule],
    // ...
})
export class AppModule {}
```
接下来编写一个操作查询和操作ElasticSearch的全文搜索服务`SearchService`，此服务用于对内容（文章）的全局搜索，所以放在内容模块下
> 关于`@elastic/elasticsearch`的使用方法请自行查看其仓库的文档

首先添加一个全局的类型`ClassToPlain`用于标注一个类到普通对象的转换类型
```typescript
// typings/global.d.ts
/**
 * 类转义为普通对象后的类型
 */
declare type ClassToPlain<T> = { [key in keyof T]: T[key] };
```
再添加一个搜索体结构内容类型
```typescript
// src/modules/content/types.ts
export type PostSearchBody = Pick<ClassToPlain<PostEntity>, 'title' | 'body' | 'summary'> & {
    categories: string;
};
```
下面编写全文搜索服务`SearchService`

- `search`方法通过传入的字符串对`posts`索引下的`'title', 'body', 'summary'`以及文章关联的分类名进行搜索，最后返回搜索出来的文章列表
- `create`方法用于在新文章创建保存到数据库后是同时把该文章的`id`等字段以及其关联的分类的名称存储到ElasticSearch的`posts`索引中
- `update`方法用于在更新文章时同步更新ElasticSearch的`posts`索引中对应`id`的文章的数据
- `delete`方法用于在删除文章时同时删除ElasticSearch的`posts`索引中对应`id`的文章（注意：在`PostService`中我们在软删除时也需要把该数据从ElasticSearch中删除，但是在恢复时我们可以把它也恢复到ElasticSearch中）
```typescript
// src/modules/content/services/search.service.ts
@Injectable()
export class SearchService {
    index = 'posts';

    constructor(protected esService: ElasticsearchService) {}

    /**
     * 根据传入的字符串搜索文章
     * @param text
     */
    async search(text: string) {
        const { hits } = await this.esService.search<PostEntity>({
            index: this.index,
            query: {
                multi_match: { query: text, fields: ['title', 'body', 'summary', 'categories'] },
            },
        });
        return hits.hits.map((item) => item._source);
    }

    /**
     * 当创建一篇文章时创建它的es索引
     * @param post
     */
    async create(post: PostEntity): Promise<WriteResponseBase> {
        return this.esService.index<PostSearchBody>({
            index: this.index,
            document: {
                ...pick(instanceToPlain(post), ['id', 'title', 'body', 'summary']),
                categories: (post.categories ?? []).join(','),
            },
        });
    }

    /**
     * 更新文章时更新它的es字段
     * @param post
     */
    async update(post: PostEntity) {
        const newBody: PostSearchBody = {
            ...pick(instanceToPlain(post), ['title', 'body', 'author', 'summary']),
            categories: (post.categories ?? []).join(','),
        };
        const script = Object.entries(newBody).reduce(
            (result, [key, value]) => `${result} ctx._source.${key}=>'${value}';`,
            '',
        );
        return this.esService.updateByQuery({
            index: this.index,
            query: { match: { id: post.id } },
            script,
        });
    }

    /**
     * 删除文章的同时在es中删除这篇文章
     * @param postId
     */
    async remove(postId: string) {
        return this.esService.deleteByQuery({
            index: this.index,
            query: { match: { id: postId } },
        });
    }
}
```
### 使用全文搜索
修改`PostEntity`以支持`against`关键字的全文搜索，为需要支持全文搜索功能的字段添加上`@Index({ fulltext: true })`索引
```typescript
// src/modules/content/entities/post.entity.ts
export class PostEntity extends BaseEntity {
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Expose()
    @Column({ comment: '文章标题' })
    @Index({ fulltext: true })
    title: string;

    @Expose({ groups: ['post-detail'] })
    @Column({ comment: '文章内容', type: 'longtext' })
    @Index({ fulltext: true })
    body: string;

    @Expose()
    @Column({ comment: '文章描述', nullable: true })
    @Index({ fulltext: true })
    summary?: string;
    // ...
}
```
同时为了支持使用关联的分类名称来全文搜索文章，我们还需要给`CategoryEntity`的`name`字段也添加一下`index`索引
```typescript
// src/modules/content/entities/category.entity.ts
export class CategoryEntity extends BaseEntity {
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Expose()
    @Column({ comment: '分类名称' })
    @Index({ fulltext: true })
    name: string;
    // ...
}
```
修改`QueryPostDto`以便传入全文搜索的`query`属性
```typescript
// src/modules/content/dtos/post.dto.ts
@DtoValidation({ type: 'query' })
export class QueryPostDto implements PaginateOptions {
    @MaxLength(100, {
        always: true,
        message: '搜索字符串长度不得超过$constraint1',
    })
    @IsOptional({ always: true })
    search?: string;
}
```
修改`PostService`

- 允许我们在没有使用（在`AppModule`中导入`ElasticModule`）ElasticSearch的情况下使用Mysql进行全文搜索
- 添加一个`search_type`参数，通过这个参数设置就可以根据我们的配置我们的全文搜索模式，默认为`against`
- 在新增，更新，删除以及恢复软删除文章时判断是否注入了`SearchService`服务，如果注入则同时对ElasticSearch中`posts`索引的这些数据进行同样的操作
- 在查询文章列表时，判断请求数据中是否有传入`search`属性，如果有传入则返回全文搜索后的分页结果，逻辑如下 
   1. 如果有注入`SearchService`服务且`search_type`为`against`，则使用`SearchService`的`search`方法，通过请求数据传入的`search`字符串对存储在Elastic中的文章数据进行全文搜索，对得出的结果使用`manualPaginate`方法进行手动分页后返回响应
   2. 如果`search_type`是`like`或者`against`，则在`buildListQuery`对数据添加`like`或`against`全文搜索的Sql处理
> 需要注意的是：
>  
> `against`不支持向前的模糊匹配，比如一个文章关联的其中一个分类名称为`我是分类1`，你搜索时传入`我是*`是可以匹配到文章数据的，而传入`*分类1`是匹配不到的,**但是性能及佳**。具体语法的话自己谷歌就行（类似两种模式这些），用法很简单，不明白的话可以教室群提问！
>  
> 而`like`可以实现任何自动的模糊匹配，但是性能比较一般
>  
> 我们一般会这样使用，在中小型应用中，不考虑向前模糊匹配的话一般使用`against`，考虑到全文模糊匹配的话就使用`like`，大型应用可以使用Elastic等专业的全文搜索工具

```typescript
// src/modules/content/dtos/post.dto.ts
export class PostService {

    constructor(
        protected repository: PostRepository,
        protected categoryRepository: CategoryRepository,
        protected categoryService: CategoryService,
        protected searchService?: SearchService,
        protected search_type: SearchType = 'against',
    ) {}
  
    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        if (
            !isNil(this.searchService) &&
            !isNil(options.search) &&
            this.search_type === 'elastic'
        ) {
            const { search: text, page, limit } = options;
            const results = await this.searchService.search(text);
            const ids = results.map((result) => result.id);
            const posts =
                ids.length <= 0 ? [] : await this.repository.find({ where: { id: In(ids) } });
            return manualPaginate({ page, limit }, posts);
        }
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }


    async create(data: CreatePostDto) {
        // ...
        if (!isNil(this.searchService)) {
            try {
                await this.searchService.create(item);
            } catch (err) {
                throw new InternalServerErrorException(err);
            }
        }

        return this.detail(item.id);
    }

    async update(data: UpdatePostDto) {
        // ...
        if (!isNil(this.searchService)) {
            try {
                await this.searchService.update(post);
            } catch (err) {
                throw new InternalServerErrorException(err);
            }
        }
        return this.detail(data.id);
    }

    async delete(ids: string[], trash?: boolean) {
        // ...
        if (!isNil(this.searchService)) {
            try {
                for (const id of ids) await this.searchService.remove(id);
            } catch (err) {
                throw new InternalServerErrorException(err);
            }
        }
        return result;
    }

    async restore(ids: string[]) {
        // ...
        if (!isNil(this.searchService)) {
            try {
                for (const id of trasheds) await this.searchService.create(id);
            } catch (err) {
                throw new InternalServerErrorException(err);
            }
        }
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), {}, async (qbuilder) =>
            qbuilder.andWhereInIds(trasheds),
        );
        return qb.getMany();
    }

    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        // ...
         if (!isNil(search)) {
            if (this.search_type === 'like') {
                qb.andWhere('title LIKE :search', { search: `%${search}%` })
                    .orWhere('body LIKE :search', { search: `%${search}%` })
                    .orWhere('summary LIKE :search', { search: `%${search}%` })
                    .orWhere('post.categories LIKE :search', {
                        search: `%${search}%`,
                    });
            } else {
                qb.andWhere('MATCH(title) AGAINST (:search IN BOOLEAN MODE)', {
                    search: `${search}*`,
                })
                    .orWhere('MATCH(body) AGAINST (:search IN BOOLEAN MODE)', {
                        search: `${search}*`,
                    })
                    .orWhere('MATCH(summary) AGAINST (:search IN BOOLEAN MODE)', {
                        search: `${search}*`,
                    })
                    .orWhere('MATCH(categories.name) AGAINST (:search IN BOOLEAN MODE)', {
                        search: `${search}*`,
                    });
            }
        }
        this.queryOrderBy(qb, orderBy);
        if (category) {
            await this.queryByCategory(category, qb);
        }
        if (callback) return callback(qb);
        return qb;
    }
}
```
修改`ContentModule`
因为我们需要为`PostService`的构造函数传入`content`配置中的`searchType`，这需要把原来的`PostService`提供者的注册方式改成使用`useFactory`的方式来注册（这部分基本概念不了解的同学请查看我们的[【Nestjs核心概念文档】](https://pincman-classroom.feishu.cn/wiki/wikcnAtvqktxBjBJlo30d271bwe)。这样的话，那么我们就需要把`ContentModule`变成动态模块了，以便传入`content`的配置，同时为了避免重复注册，我们需要把原来的`services/index.ts`导入的`PostService`给删除掉。
> 需要注意的是因为`SearchService`是可选的，因为只有在我们的`searchType`使用`against`的时候才会注册`SearchService`这个提供者，所以我们需要使用`{ token: SearchService, optional: true }`来实现可选注入

```typescript
// src/modules/content/services/index.ts
export * from './sanitize.service';
export * from './category.service';
// export * from './post.service';
export * from './comment.service';

// src/modules/content/content.module.ts
export class ContentModule {
    static forRoot(configRegister?: () => ContentConfig): DynamicModule {
        const config: Required<ContentConfig> = {
            searchType: 'against',
            ...(configRegister ? configRegister() : {}),
        };
        const providers: ModuleMetadata['providers'] = [
            ...Object.values(services),
            PostSubscriber,
            {
                provide: PostService,
                inject: [
                    PostRepository,
                    CategoryRepository,
                    CategoryService,
                    { token: SearchService, optional: true },
                ],
                useFactory(
                    postRepository: PostRepository,
                    categoryRepository: CategoryRepository,
                    categoryService: CategoryService,
                    searchService?: SearchService,
                ) {
                    return new PostService(
                        postRepository,
                        categoryRepository,
                        categoryService,
                        searchService,
                        config.searchType,
                    );
                },
            },
        ];
        if (config.searchType === 'elastic') providers.push(SearchService);
        return {
            module: ContentModule,
            imports: [
                TypeOrmModule.forFeature(Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            controllers: Object.values(controllers),
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
同时更改一下`PostController`导入`PostService`的路径
```typescript
// src/modules/content/controllers/post.controller.ts
import { PostService } from '../services/post.service';
// ...
```
最后在`AppModule`中重新使用`forRoot`注册`ContentModule`，并传入`content`配置即可
```typescript
// src/app.module.ts
@Module({
    imports: [
        DatabaseModule.forRoot(database),
        ElasticModule.forRoot(elastic),
        ContentModule.forRoot(content),
    ],
    // ...
})
export class AppModule {}
```
接下来我们就可以切换不同的方式，在原来的全文搜索中传入`search`字符来尝试全文搜索啦！

![202302010734992.png](https://cdn.nlark.com/yuque/0/2023/png/309347/1676989842823-241f0320-8102-4fb7-af4e-39351a42074d.png#averageHue=%232c2c2c&clientId=u83104e58-bdda-4&from=ui&id=u11d990cd&originHeight=1888&originWidth=2942&originalType=binary&ratio=1.5625&rotation=0&showTitle=false&size=503427&status=done&style=none&taskId=u2678ba2f-620a-4638-b3ac-e06010303c0&title=)
