

import { CustomRepository } from '@/modules/database/decorators';

import { CategoryEntity } from '../entities';
import { BaseTreeRepository } from '@/modules/database/base';
import { OrderType, TreeChildrenResolve } from '@/modules/database/constants';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends BaseTreeRepository<CategoryEntity> {
    protected _qbName = 'category';

    protected orderBy = { name: 'customOrder', order: OrderType.ASC};

    protected _childrenResolve = TreeChildrenResolve.UP;
}
