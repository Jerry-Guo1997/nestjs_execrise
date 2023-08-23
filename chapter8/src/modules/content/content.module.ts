import { DynamicModule, ModuleMetadata } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import * as controllers from './controllers';
import * as entities from './entities';
import * as repositories from './repositories';
import * as services from './services';
import { PostSubscriber } from './subscribers';
import { ContentConfig } from './types';
import { PostService } from './services/post.service';
import { SearchService } from './services/search.service';
import { CategoryRepository, PostRepository } from './repositories';
import { CategoryService } from './services';


export class ContentModule {
    static forRoot(configRegister?: () => ContentConfig): DynamicModule{
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
                    {token: SearchService, optional: true},
                ],
                useFactory(
                    postRepository: PostRepository,
                    categoryRepository: CategoryRepository,
                    categoryService: CategoryService,
                    searchService?: SearchService,
                ){
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
        if(config.searchType === 'elastic') providers.push(SearchService);
        return{
            module: ContentModule,
            imports:[
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
