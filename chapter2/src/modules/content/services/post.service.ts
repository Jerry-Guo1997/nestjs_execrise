import { Injectable } from "@nestjs/common";
import { PostRepository } from "../repositories/post.repository";
import { PaginateOptions } from "@/modules/database/types";
import { QueryHook } from "@/modules/database/type";
import { PostEntity } from "../entities/post.entity";
import { isFunction, isNil } from "lodash";
import { EntityNotFoundError, IsNull, Not, SelectQueryBuilder } from "typeorm";
import { PostOrderType } from "../constants";

@Injectable()
export class PostService{
    constructor(protected repository:PostRepository){}

    /**
     * 获取分页数据
     * @param options 分页选项 
     * @param callback 添加额外的查询
     * @returns 
     */
    async paginate(options:PaginateOptions,callback?: QueryHook<PostEntity>){
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options,callback);
        return paginate(qb,options);
    }
    /**
     * 查询单篇文章
     * @param id 
     * @param callback 添加额外的查询 
     * @returns 
     */
    async detail(id:string,callback?:QueryHook<PostEntity>){
        let qb = this.repository.buildBaseQB();
        qb.where(`post.id = :id`,{ id });
        qb = !isNil(callback)&&isFunction(callback)?await callback(qb) :qb;
        const item = await qb.getOne();
        if(!item) throw new EntityNotFoundError(PostEntity,`The post ${id} not exist`);
        return item;
    }

    async create(data:Record<string,any>){
        const item = await this.repository.save(data);
        return this.detail(item.id);
    }

    async update(data:Record<string,any>){
        await this.repository.update(data.id, omit(data,['id']));
        return this.detail(data.id);
    }

    async delete(id:string){
        const item = await this.repository.findOneByOrFail({id});
        return this.repository.remove(item);
    }

    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: Record<string,any>,
        callback?:QueryHook<PostEntity>,
    ){
        const{orderBy,isPublished} = options;
        let newQb = qb;
        if(typeof isPublished === 'boolean'){
            newQb = isPublished 
                ? newQb.where({
                    publishAt: Not(IsNull()),
                })
                : newQb.where({
                    publishedAt: IsNull(),
                });
        }
        newQb = this.queryOrdeyBy(newQb,orderBy);
        if(callback) return callback(newQb);
        return newQb;
    }

    protected queryOrderBy(qb:SelectQueryBuilder<PostEntity>,orderBy?:PostOrderType){
        switch(orderBy){
            case PostOrderType.CREATED:
                return qb.orderBy('post.createdAt','DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt','DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt','DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder','DESC');
            default:
                return qb
                    .orderBy('post.createdAt','DESC')
                    .addOrderBy('post.updatedAt','DESC')
                    .addOrderBy('post.publishedAt','DESC');
        }
    }
}