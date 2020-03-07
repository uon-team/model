

import { ValidationFailure, Validator } from '../base/validation';


/**
 * Creates a validator that check if the value 
 * is not null nor undefined
 */
export function Required(): Validator {

    const func = function required(model: any, key: string, val: any) {

        if (val === null || val === undefined) {
            throw new ValidationFailure(Required, key, val, `field is required`);
        }

        return val;

    }

    func._forceValidation = true;

    return func;

}