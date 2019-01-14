

import { ValidationFailure } from '../Validate';


export function ValidateRange(min: number, max: number) {

    return function (model: any, key: string, val: number) {

        if (min !== null && val < min) {
            throw new ValidationFailure(ValidateRange, key, val, `minimum value is ${min}, but got ${val}`);
        }

        if (max !== null && val > max) {
            throw new ValidationFailure(ValidateRange, key, val, `maximum value is ${max}, but got ${val}`);
        }

        return val;

    }

}