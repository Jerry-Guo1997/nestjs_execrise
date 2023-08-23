import { Module } from '@nestjs/common';

import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { database } from './config';
import { ContentModule } from './modules/content/content.module';
import { AppFilter, AppIntercepter } from './modules/core/providers';
import { AppPipe } from './modules/core/providers/app.pipe';
import { DatabaseModule } from './modules/database/database.module';
import { ElasticModule } from './modules/elastic/elastic.module';
import { elastic } from './config/elastic.config';
import { content } from './config/content.config';

@Module({
    imports: [
        DatabaseModule.forRoot(database), 
        ElasticModule.forRoot(elastic), 
        ContentModule.forRoot(content),
    ],
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
