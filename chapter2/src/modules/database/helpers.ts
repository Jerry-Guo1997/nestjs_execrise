import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { PaginateOptions, PaginateReturn } from './types';

/**
 *
 * @param qb
 * @param options
 * @returns
 */
export const paginate = async <E extends ObjectLiteral>(
    qb: SelectQueryBuilder<E>,
    options: PaginateOptions,
): Promise<PaginateReturn<E>> => {
    const start = options.page > 0 ? options.page - 1 : 0;
    const totalItems = await qb.getCount();
    qb.take(options.limit).skip(start * options.limit);
    const items = await qb.getMany();
    const totalPages =
        totalItems % options.limit === 0
            ? Math.floor(totalItems / options.limit)
            : Math.floor(totalItems / options.limit) + 1;
    const remainder = totalItems % options.limit !== 0 ? totalItems % options.limit : options.limit;
    const itemCount = options.page < totalPages ? options.limit : remainder;
    return {
        items,
        meta: {
            totalItems,
            itemCount,
            perPage: options.limit,
            totalPages,
            currentPage: options.page,
        },
    };
};
