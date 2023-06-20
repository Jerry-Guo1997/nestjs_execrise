import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { DatabaseModule } from '../database/database.module';
import { PostController } from './controllers/post.controller';
import { PostSubscriber } from './subscribers/post.subscriber';
import { PostService } from './services/post.service';
import { PostRepository } from './repositories';
import { SanitizeService } from './services';

@Module({
    imports: [TypeOrmModule.forFeature([PostEntity]), DatabaseModule.forRepository([PostRepository])],
    controllers: [PostController],
    providers: [PostService, SanitizeService, PostSubscriber],
    exports: [PostService, DatabaseModule.forRepository([PostRepository])],
})
export class ContentModule {}
