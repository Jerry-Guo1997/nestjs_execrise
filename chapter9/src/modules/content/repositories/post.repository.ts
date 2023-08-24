import { Repository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators';

import { CommentEntity } from '../entities';
import { PostEntity } from '../entities/post.entity';

@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('post')
            .leftJoinAndSelect('post.categories', 'categories')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where('c.post.id = post.id');
            }, 'commentCount')
            .loadRelationCountAndMap('post.commentCount', 'post.comments');
    }
}
