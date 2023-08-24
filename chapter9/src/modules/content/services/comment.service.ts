import { ForbiddenException, Injectable } from '@nestjs/common';

import { isNil } from 'lodash';

import { EntityNotFoundError, In, SelectQueryBuilder } from 'typeorm';

import { manualPaginate } from '@/modules/database/helpers';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos/comment.dto';
import { CommentEntity } from '../entities';

import { CommentRepository, PostRepository } from '../repositories';

@Injectable()
export class CommentService {
    constructor(
        protected repository: CommentRepository,
        protected postRepository: PostRepository,
    ) {}

    async findTrees(options: QueryCommentTreeDto = {}) {
        return this.repository.findTrees({
            addQuery: (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }

    /**
     * 查找一篇文章的评论并分页
     * @param dto
     * @returns
     */
    async paginate(dto: QueryCommentDto) {
        const { post, ...query } = dto;
        const addQuery = (qb: SelectQueryBuilder<CommentEntity>) => {
            const condition: Record<string, string> = {};
            if (!isNil(post)) condition.post = post;
            return Object.keys(condition).length > 0 ? qb.andWhere(condition) : qb;
        };
        const data = await this.repository.findRoots({
            addQuery,
        });
        let comments: CommentEntity[] = [];
        for (let i = 0; i < data.length; i++) {
            const c = data[i];
            comments.push(
                await this.repository.findDescendantsTree(c, {
                    addQuery,
                }),
            );
        }
        comments = await this.repository.toFlatTrees(comments);
        return manualPaginate(query, comments);
    }

    async create(data: CreateCommentDto) {
        const parent = await this.getParent(undefined, data.parent);
        if (!isNil(parent) && parent.post.id !== data.post) {
            throw new ForbiddenException('Parent comment and child comment must belong same post!');
        }
        const item = await this.repository.save({
            ...data,
            parent,
            post: await this.getPost(data.post),
        });
        return this.repository.findOneOrFail({ where: { id: item.id } });
    }

    async delete(ids: string[]) {
        const comments = await this.repository.find({ where: { id: In(ids) } });
        return this.repository.remove(comments);
    }

    protected async getPost(id: string) {
        return !isNil(id) ? this.postRepository.findOneOrFail({ where: { id } }) : id;
    }

    protected async getParent(current?: string, id?: string) {
        if (current === id) return undefined;
        let parent: CommentEntity | undefined;
        if (id !== undefined) {
            if (id === null) return null;
            parent = await this.repository.findOne({
                relations: ['parent', 'post'],
                where: { id },
            });
            if (!parent) {
                throw new EntityNotFoundError(CommentEntity, `Parent comment ${id} not exists!`);
            }
        }
        return parent;
    }
}
