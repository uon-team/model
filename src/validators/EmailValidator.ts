
import { ValidationFailure, Validator } from '../Validate';



const EMAIL_REGEXP = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i

/**
 * Creates a validator that will validate an email address
 */
export function ValidateEmail(): Validator {

    return function (model: any, key: string, val: string) {

        if (!EMAIL_REGEXP.test(val as string)) {
            throw new ValidationFailure(ValidateEmail, key, val, `not a valid email address`);
        }

        return val;

    }
}