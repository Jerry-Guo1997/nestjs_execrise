import { DataSource, EventSubscriber } from "typeorm";
import { SanitizeService } from "../services/sanitize.service";
import { PostRepository } from "../repositories/post.repository";
import { PostEntity } from "../entities/post.entity";
import { PostBodyType } from "../constants";

@EventSubscriber()
export class PostSubscriber{
    constructor(
        protected dataSource: DataSource,
        protected sanitizeService:SanitizeService,
        protected postRepository: PostRepository,
    ){}

    listenTo(){
        return PostEntity;
    }

    async afterLoad(entity:PostEntity){
        if (entity.type === PostBodyType.HTML){
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}