
import { Validator } from '../base/validator';
import { ValidationFailure } from '../base/validation';


/**
 * Creates a validator that check if the value 
 * is not null nor undefined
 */
export function ValidateOneOf(values: any[]): Validator {

    const func = function one_of(model: any, key: string, val: any) {

        for (let v of values) {
            if (val === v) {
                return val;
            }
        }

        throw new ValidationFailure(ValidateOneOf, key, val, { msg: `must be one of specified values`, values: values });

    }

    return func;

}