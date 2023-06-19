import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostEntity } from "./entities/post.entity";
import { DatabaseModule } from "../database/database.module";
import { PostController } from "./controllers/post.controller";
import { PostService } from "./services/post.service";
import { PostSubscriber } from "./subscribers/post.subscriber";
import { PostRepository } from "./repositories/post.repository";

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity]),
        DatabaseModule.forRepository([PostEntity]),
    ],
    controllers: [PostController],
    providers: [PostService,PostSubscriber],
    exports:[PostService,DatabaseModule.forRepository([PostRepository])],
})
export class ContentModule{}