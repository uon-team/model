
import { ValidationFailure } from '../Validate';


export function ValidatePattern(pattern: RegExp) {

    return function (model: any, key: string, val: string) {

        if (!pattern.test(val)) {
            throw new ValidationFailure(ValidatePattern, key, val, `"${val}" does not match pattern ${pattern.toString()}`);
        }

        return val;

    }
}

export function MinLength(min: number) {

    return function (model: any, key: string, val: string | any[]) {

        let str_len = val.length;

        if (str_len < min) {
            throw new ValidationFailure(MinLength, key, val, `minimum length is ${min}, but got ${str_len}`);
        }

        return val;

    }
}

export function MaxLength(max: number) {

    return function (model: any, key: string, val: string | any[]) {

        let str_len = val.length;

        if (str_len > max) {
            throw new ValidationFailure(MaxLength, key, val, `maximum length is ${max}, but got ${str_len}`);
        }

        return val;

    }
}


