

import { Validator } from '../base/validator';
import { ValidationFailure } from '../base/validation';


/**
 * Creates a validator that check if the value 
 * is not null nor undefined
 */
export function Required(): Validator {

    const func = function required(model: any, key: string, val: any) {

        if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
            throw new ValidationFailure(Required, key, val, { msg: `field is required` });
        }

        return val;

    }

    func._forceValidation = true;

    return func;

}