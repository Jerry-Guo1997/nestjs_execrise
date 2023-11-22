import { DataSource, EventSubscriber } from 'typeorm';

import { PostBodyType } from '../constants';
import { PostEntity } from '../entities/post.entity';
import { PostRepository } from '../repositories/post.repository';
import { SanitizeService } from '../services/sanitize.service';
import { BaseSubscriber } from '@/modules/database/base/subscriber';

@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity>{
    constructor(
        protected dataSource: DataSource,
        protected sanitizeService: SanitizeService,
        protected postRepository: PostRepository,
    ) {
        super(dataSource);
    }

    protected entity = PostEntity;

    listenTo() {
        return PostEntity;
    }

    async afterLoad(entity: PostEntity) {
        if (entity.type === PostBodyType.HTML) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
