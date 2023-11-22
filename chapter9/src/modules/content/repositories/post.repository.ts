import { CustomRepository } from '@/modules/database/decorators';

import { CommentEntity } from '../entities';
import { PostEntity } from '../entities/post.entity';
import { BaseRepositiory } from '@/modules/database/base/repository';

@CustomRepository(PostEntity)
export class PostRepository extends BaseRepositiory<PostEntity> {
    protected _qbName = 'post';
    buildBaseQB() {
        return this.createQueryBuilder(this.qbName)
            .leftJoinAndSelect(`${this.qbName}.categories`, 'categories')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where('c.post.id = post.id');
            }, 'commentCount')
            .loadRelationCountAndMap(`${this.qbName}.commentCount`, `${this.qbName}.comments`);
    }
}
