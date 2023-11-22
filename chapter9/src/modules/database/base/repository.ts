import { isNil } from "lodash";
import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { OrderQueryType } from "../types";
import { OrderType } from "../constants";
import { getOrderByQuery } from "../helpers";

export abstract class BaseRepositiory<E extends ObjectLiteral> extends Repository<E> {

    protected abstract _qbName: string;

    protected orderBy?: string | { name: string; order: `${OrderType}`};

    get qbName() {
        return this._qbName;
    }
    
    addOrderByQuery(qb: SelectQueryBuilder<E>, orderBy?: OrderQueryType){
        const orderByQuery = orderBy ?? this.orderBy;
        return !isNil(orderByQuery) ? getOrderByQuery(qb, this.qbName, orderByQuery) : qb;
    }

    buildBaseQB(): SelectQueryBuilder<E> {
        return this.createQueryBuilder(this.qbName);
    }
}

