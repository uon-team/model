
import { Validator } from '../base/validator';
import { ValidationFailure } from '../base/validation';



export const AMERICA_REGEXP = /^(?:\(\d{3}\)|\d{3})[- ]?\d{3}[- ]?\d{4}$/;

/**
 * Creates a validator that will validate an American phone number
 * TODO Implement a better test
 */
export function ValidatePhone(): Validator {

    return function (model: any, key: string, val: string) {

        if (!AMERICA_REGEXP.test(val as string)) {
            throw new ValidationFailure(ValidatePhone, key, val, { msg: `not a valid phone number` });
        }

        return val;

    }
}