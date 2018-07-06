import { ValidationError } from "../ValidationError";


const EMAIL_REGEXP = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i

export function EmailValidator() {

    return function (model: any, key: string, val: string) {


        if (!EMAIL_REGEXP.test(val as string)) {
            throw new ValidationError(EmailValidator, model, key, val, `${val} is not a valid email address`);
        }

        return val;

    }
}