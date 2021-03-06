
import { ValidationFailure } from '../base/validation';

const MONGO_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/**
 * Creates a validator that will test the provided regex
 * @param pattern 
 */
export function ValidatePattern(pattern: RegExp) {

    return function (model: any, key: string, val: string) {

        if (!pattern.test(val)) {
            throw new ValidationFailure(ValidatePattern, key, val, `"${val}" does not match pattern ${pattern.toString()}`);
        }

        return val;

    }
}

/**
 * Creates a validator that will test for a native mongo id
 */
export function ValidateMongoId() {

    return function (model: any, key: string, val: string) {

        if (val && val.match(MONGO_ID_REGEX) !== null) {
            throw new ValidationFailure(ValidateMongoId, key, val, `"${val}" does not match pattern ${MONGO_ID_REGEX.toString()}`);
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

        let str_len = val.length;

        if (str_len < min) {
            throw new ValidationFailure(MinLength, key, val, `below minimum length`);
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

        let str_len = val.length;

        if (str_len > max) {
            throw new ValidationFailure(MaxLength, key, val, `above maximum length`);
        }

        return val;

    }
}


