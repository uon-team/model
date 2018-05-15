
import { ValidationError } from '../ValidationError';


export function PatternValidator(pattern: RegExp) {

    return function (model: any, key: string, val: string) {

        if (!pattern.test(val)) {
            throw new ValidationError(PatternValidator, `Value ${val} does not match pattern ${pattern.source}`);
        }

        return val;

    }
}

export function MinLengthValidator(min: number) {

    return function (model: any, key: string, val: string | any[]) {

        let str_len = val.length;

        if (str_len < min) {
            throw new ValidationError(MinLengthValidator, `minimum length is ${min}, but got ${str_len}`);
        }

        return val;

    }
}

export function MaxLengthValidator(max: number) {

    return function (model: any, key: string, val: string | any[]) {

        let str_len = val.length;

        if (str_len > max) {
            throw new ValidationError(MaxLengthValidator, `maximum length is ${max}, but got ${str_len}`);
        }

        return val;

    }
}