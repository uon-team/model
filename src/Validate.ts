
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

export async function Validate<T>(target: T): Promise<ValidationResult<T>> {

     // grab type
     const type = target.constructor as Type<T>;

     // get model metadata
     const model = FindModelAnnotation(type);

     // fetch members decorators
     const members = GetModelMembers(model);

     const failures: ValidationFailure[] = [];

     // go over each member and call validators if any
     for(let i = 0, l = members.length; i < l; ++i) {

        const member = members[i];
        const validators = member.validators;

        // FIXME not sure about performance hit here, maybe throwing and catching a lot
        // TODO handle Array element validation, also TypedNumbers
        if(validators && validators.length) {

            for(let j = 0, jl = validators.length; j < jl; ++j) {

                try {
                    await validators[j](target, member.key, (target as any)[member.key])
                }
                catch(err) {

                    if(err instanceof ValidationFailure) {
                        failures.push(err);
                    }
                    else {
                        throw err;
                    }
                }
            }
        }

     }
 
 
     return new ValidationResult(target, failures);;


}

