
import { ValidationFailure } from '../Validate';



const EMAIL_REGEXP = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i

export function ValidateEmail() {

    return function (model: any, key: string, val: string) {


        if (!EMAIL_REGEXP.test(val as string)) {
            throw new ValidationFailure(ValidateEmail, key, val, `${val} is not a valid email address`);
        }

        return val;

    }
}