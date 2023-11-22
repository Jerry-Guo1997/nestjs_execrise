import { ClassSerializerInterceptor, PlainLiteralObject, StreamableFile } from '@nestjs/common';
import { ClassTransformOptions } from '@nestjs/common/interfaces/external/class-transform-options.interface';
import { isArray, isNil, isObject } from 'lodash';

export class AppIntercepter extends ClassSerializerInterceptor {
    serialize(
        response: PlainLiteralObject | PlainLiteralObject[],
        options: ClassTransformOptions,
    ): PlainLiteralObject | PlainLiteralObject[] {
        if ((!isObject(response) && !isArray(response)) || response instanceof StreamableFile) {
            return response;
        }

        // 如果响应数据是数组，则遍历对每一项进行序列化
        if (isArray(response)) {
            return (response as PlainLiteralObject[]).map((item) =>
                !isObject(item) ? item : this.transformToPlain(item, options),
            );
        }

        // 如果是分页数据，则对items中的每一项进行序列化
        if ('meta' in response && 'item' in response) {
            const items = !isNil(response.item) && isArray(response.item) ? response.item : [];
            return {
                ...response,
                items: (items as PlainLiteralObject[]).map((item) => {
                    return !isObject(item) ? item : this.transformToPlain(item, options);
                }),
            };
        }

        // 如果响应是对象则直接序列化
        return this.transformToPlain(response, options);
    }
}