
import { Type, Injector, PropertyNamesNotOfType } from '@uon/core';
import { Model } from 'src/meta/model.decorator';
import { FindModelAnnotation } from '../utils/model.utils';
import { Validator } from './validator';



export interface FlatValidationResult {

    /**
     * The path to the value in the model
     */
    path: string[];

    /**
     * Map of validator names and associated message
     */
    errors: { [k: string]: string };

}

/**
 * 
 */
export class ValidationResult<T> {

    readonly failures: ValidationFailure[] = [];
    readonly key: string;

    constructor(key: string) {
        this.key = key;
    }

    get valid() {
        return this.failures.length === 0;
    }

    flatten(out: FlatValidationResult[] = [], _path: string[] = []) {

        if (this.failures.length == 0) {
            return out;
        }

        // copy provided path
        let path: string[] = _path.slice(0);
        let errors: { [k: string]: string } = {};

        for (let f of this.failures) {
            errors[f.validator.name] = f.context;
        }

        out.push({
            path,
            errors
        });

        return out;

    }
}

export type ModelPossibleValidationMember<T> = Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>;
export type ModelValidationMembers<T, P = ModelPossibleValidationMember<T>> = {
    [K in keyof P]?: ValidationResult<P[K]>
}

export class ModelValidationResult<T> extends ValidationResult<T>  {

    readonly children: ModelValidationMembers<T> = {};

    constructor(key: string) {
        super(key);

    }

    get valid() {

        for (let k in this.children) {
            let key = k as keyof ModelValidationMembers<T>;
            if (!this.children[key].valid) {
                return false;
            }
        }

        return this.failures.length === 0;
    }

    flatten(out: FlatValidationResult[] = [], _path: string[] = []) {

        super.flatten(out, _path);

        for (let k in this.children) {

            let path: string[] = _path.slice(0);
            path.push(k);

            (this.children as any)[k].flatten(out, path);

        }

        return out;

    }


    filter(ignored: Function[]) {

        return this._filter(ignored, this);

    }

    private _filter(ignored: Function[], val: ValidationResult<any>) {

        let failures: ValidationFailure[] = [];
        for (let f of val.failures) {
            if (ignored.indexOf(f.validator) == -1) {
                failures.push(f);
            }
        }

        if (val instanceof ModelValidationResult) {

            let result = new ModelValidationResult<any>(val.key);
            result.failures.push(...failures);

            // recurse
            for (let k in val.children) {
                let c = this._filter(ignored, val.children[k]);
                result.children[k] = c;
            }

            return result;
        }

        let result = new ValidationResult<any>(val.key);
        result.failures.push(...failures);

        return result;
    }
}

export class ValidationFailure {

    constructor(
        readonly validator: Function,
        readonly key: string,
        readonly value: any,
        readonly context: any
    ) {

    }
}


/**
 * Validate a model
 * @param target the model instance to validate
 * @param extraValidators a map of extra validator to run
 * @param injector An optional injector to pass to each validators, some validators will require that you pass this
 * @param _key The "parent" key in case of recursive or array validation
 */
export async function Validate<T>(target: T,
    extraValidators: { [k: string]: Validator[] } = {},
    injector: Injector = null,
    _key: string,
    _skipUndefined = false): Promise<ModelValidationResult<T>> {

    // grab type
    const type = target.constructor as Type<T>;
    const model = type ? FindModelAnnotation(type) as Model : null;

    const validators: { [K in keyof T]: Validator[] } = model ? Object.assign({}, model.validators as any) : {};

    // append extra validators
    const extra_keys = Object.keys(extraValidators) as unknown as (keyof T)[];
    for (let i = 0, l = extra_keys.length; i < l; ++i) {
        let k = extra_keys[i];

        validators[k] = validators[k] || [];
        validators[k] = validators[k].concat(extraValidators[k as any] as any[]);
    }

    const keys = Object.keys(validators) as unknown as (keyof ModelValidationMembers<T>)[];
    const failures: ValidationFailure[] = [];

    let result = new ModelValidationResult<T>(_key);

    // go over each member and call validators if any
    for (let i = 0, l = keys.length; i < l; ++i) {

        const key = keys[i];
        const v = validators[key];
        const value = (target as any)[key];

        // FIXME not sure about performance hit here, maybe throwing and catching a lot
        // TODO handle Array element validation, also TypedNumbers

        for (let j = 0, jl = v.length; j < jl; ++j) {

            if ((value === undefined || value === '' || value === null) && (v[j]._forceValidation !== true || _skipUndefined)) {
                continue;
            }

            try {
                await v[j](target, key as string, value, injector);
            }
            catch (err) {

                let is_validation_result = err instanceof ModelValidationResult;

                if (!result.children[key]) {
                    result.children[key] = (v[j] as any)._modelValidator
                        ? is_validation_result
                            ? err
                            : new ModelValidationResult<any>(key as string)
                        : new ValidationResult<any>(key as string)
                }

                if (err instanceof ValidationFailure) {
                    result.children[key].failures.push(err);
                }
                else if (!is_validation_result) {
                    throw err;
                }
            }
        }


    }


    return result;


}

