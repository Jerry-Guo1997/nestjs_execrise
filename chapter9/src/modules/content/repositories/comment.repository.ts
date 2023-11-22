import { isNil } from 'lodash';


import { CustomRepository } from '@/modules/database/decorators';

import { CommentEntity } from '../entities';
import { BaseTreeRepository } from '@/modules/database/base';
import { FindTreeOptions, SelectQueryBuilder } from 'typeorm';
import { QueryParams } from '@/modules/database/types';


@CustomRepository(CommentEntity)
export class CommentRepository extends BaseTreeRepository<CommentEntity> {
    protected _qbName = 'comment';

    protected orderBy = 'createdAt';

    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity>{
        return super.buildBaseQB(qb).leftJoinAndSelect(`${this.qbName}.post`, 'post');
    }

    async findTrees(
        options: FindTreeOptions & QueryParams<CommentEntity> & {post?: string } = {},
    ): Promise<CommentEntity[]>{
        return super.findTrees({
            ...options,
            addQuery: async (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', {id: options.post});
            },
        });
    }
}
