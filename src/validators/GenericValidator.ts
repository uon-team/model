

import { ValidationFailure, Validator } from '../Validate';


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

export function Prohibited(): Validator {

    const func = function prohibited(model: any, key: string, val: any) {

        if (val !== null || val !== undefined) {
            throw new ValidationFailure(Prohibited, key, val, `field is prohibited`);
        }

        return val;

    }

    return func;

}