

import { ValidationError } from '../ValidationError';


export function NumberValidator(min: number, max: number) {

    return function (model: any, key: string, val: number) {

        if(min !== null && val < min) {
            throw new ValidationError(NumberValidator, model, key, val, `minimum value is ${min}, but got ${val}`);
        }

        if(max !== null && val > max) {
            throw new ValidationError(NumberValidator, model, key, val, `maximum value is ${max}, but got ${val}`);
        }

        return val;

    }

}