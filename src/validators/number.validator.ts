

import { Validator } from '../base/validator';
import { ValidationFailure } from '../base/validation';


/**
 * Create a number range validator
 * @param min Minimum value to compare against, can be null to omit check
 * @param max Maximum value to compare against, can be null to omit check
 */
export function ValidateRange(min: number, max: number): Validator {

    return function (model: any, key: string, val: number) {

        if (typeof val !== 'number') {
            throw new ValidationFailure(ValidateRange, key, val, {
                msg: `value must be a number`,
                type: typeof val
            });
        }

        if (typeof min === 'number' && val < min) {
            throw new ValidationFailure(ValidateRange, key, val, {
                msg: `below minimum value`,
                min: min,
                value: val
            });
        }

        if (typeof max === 'number' && val > max) {
            throw new ValidationFailure(ValidateRange, key, val, {
                msg: `above maximum value`,
                max: max,
                value: val
            });
        }

        return val;

    }

}