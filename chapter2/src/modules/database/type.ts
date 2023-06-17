import {SelectQueryBuilder, ObjectLiteral} from 'typeorm';

/**
 * 分页验证DTO接口
 */
// export interface IPaginateDto<C extends IPaginationMeta = IPaginationMeta> 
//     extends Omit<IPaginationOptions<C>,'page'|'limit'>{
//         page:number;
//         limit:number;
// }

/**
 * 为queryBuilder添加查询的回调函数接口
 */
export type QueryHook<Entity> = (
    qb: SelectQueryBuilder<Entity>,
) => Promise<SelectQueryBuilder<Entity>>;