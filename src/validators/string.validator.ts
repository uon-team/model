
import { ValidationFailure } from '../base/validation';

export const MONGO_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/**
 * Creates a validator that will test the provided regex
 * @param pattern 
 */
export function ValidatePattern(pattern: RegExp) {

    return function (model: any, key: string, val: string) {

        if (!pattern.test(val)) {
            throw new ValidationFailure(
                ValidatePattern,
                key,
                val,
                {
                    msg: `does not match pattern`,
                    value: val,
                    pattern: pattern.toString()
                }
            );
        }

        return val;

    }
}

/**
 * Creates a validator that will test for a native mongo id
 */
export function ValidateMongoId() {

    return function (model: any, key: string, val: string) {

        if (val && val.match(MONGO_ID_REGEX) == null) {
            throw new ValidationFailure(ValidateMongoId, key, val, {
                msg: 'must be a valid id',
                value: val

            });
        }

        return val;

    }
}

/**
 * Creates a validator that will test that a string value is at least the provided length 
 * @param min 
 */
export function MinLength(min: number) {

    return function (model: any, key: string, val: string | any[]) {

        if (val === null || val === undefined) {
            return val;
        }

        let str_len = val.length;

        if (str_len < min) {
            throw new ValidationFailure(MinLength, key, val, {
                msg: `below minimum length`,
                minLength: min,
                length: val.length
            });
        }

        return val;

    }
}

/**
 * Creates a validator that will test that a string value is at maximum the provided length 
 * @param max 
 */
export function MaxLength(max: number) {

    return function (model: any, key: string, val: string | any[]) {

        if (val === null || val === undefined) {
            return val;
        }

        let str_len = val.length;

        if (str_len > max) {
            throw new ValidationFailure(MaxLength, key, val, {
                msg: `above maximum length`,
                maxLength: max,
                length: val.length
            });
        }

        return val;

    }
}


