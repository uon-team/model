
import { ValidationFailure, Validate } from '../base/validation';
import { Validator } from '../base/validator';
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

        let validation = await Validate(val, extra, injector, key, _skipUndefined);

        if (!validation.valid) {
            throw validation;
        }

        return val;

    }

    //
    func._fieldValidators = extra;
    func._modelValidator = true;

    return func;

}
