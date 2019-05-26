
import { Type } from '@uon/core';
import { FindModelAnnotation, GetModelMembers } from './Utils';


export type Validator = (model: any, key: string, val: any) => any;


/**
 * 
 */
export class ValidationResult<T> {

    constructor(private _target: T, private _failures: ValidationFailure[]) {

    }

    get valid() {
        return this._failures.length === 0;
    }

    get failures() {
        return this._failures;
    }

}


export class ValidationFailure {

    constructor(
        readonly validator: Function,
        readonly key: string,
        readonly value: any,
        readonly reason: string
    ) {

    }
}

export async function Validate<T>(target: T, extraValidators: { [k: string]: Validator[] } = {}): Promise<ValidationResult<T>> {

    // grab type
    const type = target.constructor as Type<T>;
    const model = FindModelAnnotation(type);

    const validators: { [k: string]: Validator[] } = model ? Object.assign({}, model.validators) : {};

    // append extra validators
    const extra_keys = Object.keys(extraValidators);
    for (let i = 0, l = extra_keys.length; i < l; ++i) {
        let k = extra_keys[i];

        validators[k] = validators[k] || [];
        validators[k] = validators[k].concat(extraValidators[k]);
    }

    const keys = Object.keys(validators);
    const failures: ValidationFailure[] = [];

    // go over each member and call validators if any
    for (let i = 0, l = keys.length; i < l; ++i) {

        const key = keys[i];
        const v = validators[key];
        const value = (target as any)[key];

        // FIXME not sure about performance hit here, maybe throwing and catching a lot
        // TODO handle Array element validation, also TypedNumbers

        for (let j = 0, jl = v.length; j < jl; ++j) {

            if (value === undefined && (v[j] as any)._forceValidation !== true) {
                continue;
            }

            try {
                await v[j](target, key, value)
            }
            catch (err) {

                if (err instanceof ValidationFailure) {
                    failures.push(err);
                }
                else {
                    throw err;
                }
            }
        }


    }


    return new ValidationResult(target, failures);


}

