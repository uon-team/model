

import { ValidationFailure, Validator } from '../base/validation';


/**
 * Create a number range validator
 * @param min Minimum value to compare against, can be null to omit check
 * @param max Maximum value to compare against, can be null to omit check
 */
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