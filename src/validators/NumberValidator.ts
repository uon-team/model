

import { ValidationFailure, Validator } from '../Validate';


export function ValidateRange(min: number, max: number): Validator {

    return function (model: any, key: string, val: number) {

        if (min !== null && val < min) {
            throw new ValidationFailure(ValidateRange, key, val, `below minimum value`);
        }

        if (max !== null && val > max) {
            throw new ValidationFailure(ValidateRange, key, val, `above maximum value`);
        }

        return val;

    }

}