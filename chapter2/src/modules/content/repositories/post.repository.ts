import { CustomRepository } from "@/modules/database/decorators";
import { PostEntity } from "../entities/post.entity";
import { Repository } from "typeorm";

@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB(){
        return this.createQueryBuilder('post');
    }
}