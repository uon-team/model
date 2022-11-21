
import { ValidationFailure, Validator, Validate } from '../base/validation';
import { Type, Injector } from '@uon/core';

/**
 * Create a model validator
 * @param modelType 
 * @param extra 
 */
export function ValidateModel<T>(extra?: { [k in keyof Partial<T>]: Validator[] }, _skipUndefined = false): Validator {

    const func = async function validateModel(model: any, key: string, val: T, injector?: Injector) {

        if (val == null || val == undefined) {
            return val;
        }

        let validation = await Validate(val, extra, injector, 0, _skipUndefined);

        if (!validation.valid) {
            throw new ValidationFailure(ValidateModel,
                key,
                val,
                validation.failures.map(f => '\t' + f.key + ': ' + f.reason).join('\n')
            );
        }

        return val;

    }

    return func;

}
