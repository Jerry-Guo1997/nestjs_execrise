import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isArray, isFunction, isNil, omit } from 'lodash';
import { EntityNotFoundError, In, IsNull, Not, SelectQueryBuilder } from 'typeorm';

import { manualPaginate, paginate } from '@/modules/database/helpers';
import { QueryHook } from '@/modules/database/types';

import { PostOrderType } from '../constants';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dtos';
import { PostEntity } from '../entities/post.entity';
import { CategoryRepository } from '../repositories';
import { PostRepository } from '../repositories/post.repository';

import { CategoryService } from './category.service';
import { SearchService } from './search.service';
import { SearchType } from '../types';
import { BaseService } from '@/modules/database/base/service';

// 文章查询接口
type FindParams = {
    [key in keyof Omit<QueryPostDto, 'limit' | 'page'>]: QueryPostDto[key];
};
@Injectable()
export class PostService extends BaseService<PostEntity, PostRepository, FindParams>{
    protected enableTrash = true;

    constructor(
        protected repository: PostRepository,
        protected categoryRepository: CategoryRepository,
        protected categoryService: CategoryService,
        protected searchService?: SearchService,
        protected search_type: SearchType = 'against',
    ) {
        super(repository);
    }

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     * @returns
     */
    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        if (!isNil(this.searchService) && !isNil(options.search) && this.search_type === 'elastic') {
            const { search: text, page, limit } = options;
            const results = await this.searchService.search(text);
            const ids = results.map((result) => result.id);
            const posts = ids.length <= 0 ? [] : await this.repository.find({ where: { id: In(ids) } });
            return manualPaginate({ page, limit }, posts);
        }
        const qb = await this.buildListQB(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }

    /**
     * 查询单篇文章
     * @param id
     * @param callback 添加额外的查询
     * @returns
     */
    async detail(id: string, callback?: QueryHook<PostEntity>) {
        let qb = this.repository.buildBaseQB();
        qb.where(`post.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) throw new EntityNotFoundError(PostEntity, `The post ${id} not exist`);
        return item;
    }

    async create(data: CreatePostDto) {
        const createPostDto = {
            ...data,
            categories: isArray(data.categories)
                ? await this.categoryRepository.findBy({
                    id: In(data.categories),
                })
                : [],
        };
        const item = await this.repository.save(createPostDto);
        if (!isNil(this.searchService)) {
            try {
                await this.searchService.create(item);
            } catch (err) {
                throw new InternalServerErrorException(err);
            }
        }
        return this.detail(item.id);
    }

    async update(data: UpdatePostDto) {
        const post = await this.detail(data.id);
        if (isArray(data.categories)) {
            await this.repository
                .createQueryBuilder('post')
                .relation(PostEntity, 'categories')
                .of(post)
                .addAndRemove(data.categories, post.categories ?? []);
        }
        await this.repository.update(data.id, omit(data, ['id', 'categories']));
        if (!isNil(this.searchService)) {
            try {
                await this.searchService.update(post);
            } catch (err) {
                throw new InternalServerErrorException(err);
            }
        }
        return this.detail(data.id);
    }

    async delete(ids: string[], trash?: boolean) {
        const result = await super.delete(ids, trash);
        if(!isNil(this.searchService)){
            try{
                for(const id of ids) await this.searchService.remove(id);
            }catch(err){
                throw new InternalServerErrorException(err);
            }
        }
        return result;
    }

    async restore(ids: string[]) {
        const result = await super.restore(ids);
        if(!isNil(this.searchService)){
            try{
                for(const item of result) await this.searchService.create(item);
            }catch(err){
                throw new InternalServerErrorException(err);
            }
        }
        return result;
    }

    protected async buildListQB(
        queryBuilder: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        const { category, orderBy, isPublished, search } = options;
        const qb = await super.buildListQB(queryBuilder, options, callback);
        
        if (typeof isPublished === 'boolean') {
            isPublished
                ? qb.where({
                    publishAt: Not(IsNull()),
                })
                : qb.where({
                    publishedAt: IsNull(),
                });
        }

        if (!isNil(search)) {
            if (this.search_type === 'like') {
                qb.andWhere('title LIKE :search', { search: `%${search}%` })
                    .orWhere('body LIKE :search', { search: `%${search}%` })
                    .orWhere('summary LIKE :search', { search: `%${search}%` })
                    .orWhere('post.categories LIKE :search', { search: `%${search}%` });
            } else {
                qb.andWhere('Match(title) AGAINST (:search IN BOOLEAN MODE)', { search: `${search}*` })
                    .orWhere('Match(body) AGAINST (:search IN BOOLEAN MODE)', { search: `${search}*` })
                    .orWhere('Match(summary) AGAINST (:search IN BOOLEAN MODE)', { search: `${search}*` })
                    .orWhere('Match(categories.name) AGAINST (:search IN BOOLEAN MODE)', { search: `${search}*` });
            }
        }
        this.addOrderByQuery(qb, orderBy);
        if (category) {
            await this.queryByCategory(category, qb);
        }
        //if (callback) return callback(qb);
        return qb;
    }

    protected addOrderByQuery(qb: SelectQueryBuilder<PostEntity>, orderBy?: PostOrderType) {
        switch (orderBy) {
            case PostOrderType.CREATED:
                return qb.orderBy('post.createdAt', 'DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrderType.COMMENTCOUNT:
                return qb.orderBy('commentCount', 'DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC')
                    .addOrderBy('commentCount', 'DESC');
        }
    }

    protected async queryByCategory(id: string, qb: SelectQueryBuilder<PostEntity>) {
        const root = await this.categoryService.detail(id);
        const tree = await this.categoryRepository.findDescendantsTree(root);
        const flatDes = await this.categoryRepository.toFlatTrees(tree.children);
        const ids = [tree.id, ...flatDes.map((item) => item.id)];
        return qb.where('categories.id IN (:...ids)', { ids });
    }
}
