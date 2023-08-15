import { ArgumentMetadata, Injectable, Paramtype, ValidationPipe } from '@nestjs/common';

import merge from 'deepmerge';
import { isObject, omit } from 'lodash';

import { DTO_VALIDATION_OPTIONS } from '../constants';

@Injectable()
export class AppPipe extends ValidationPipe {
    async transform(value: any, metadata: ArgumentMetadata) {
        const { metatype, type } = metadata;

        const dto = metatype as any;

        const options = Reflect.getMetadata(DTO_VALIDATION_OPTIONS, dto) || {};

        const originOptions = { ...this.validatorOptions };

        const originTransform = { ...this.transformOptions };

        const { transformOptions, type: optionsType, ...customOptions } = options;

        const requestType: Paramtype = optionsType ?? 'body';

        if (requestType !== type) return value;

        if (transformOptions) {
            this.transformOptions = merge(this.transformOptions, transformOptions ?? {}, {
                arrayMerge: (_d, s, _o) => s,
            });
        }

        this.validatorOptions = merge(this.validatorOptions, customOptions ?? {}, {
            arrayMerge: (_d, s, _o) => s,
        });

        const toValidate = isObject(value)
            ? Object.fromEntries(
                  Object.entries(value as Record<string, any>).map(([key, v]) => {
                      if (!isObject(v) || !('mimetype' in v)) return [key, v];
                      return [key, omit(v, ['fields'])];
                  }),
              )
            : value;

        const result = await super.transform(toValidate, metadata);

        this.validatorOptions = originOptions;

        this.transformOptions = originTransform;

        return result;
    }
}
