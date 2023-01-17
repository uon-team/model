import { Validator } from "../base/validator";
import { ValidationFailure } from "../base/validation";



/**
 * Creates a validator that prohibits a field of having 
 * any value other than null or undefined
 */
export function Prohibited(): Validator {

    const func = function prohibited(model: any, key: string, val: any) {

        if (val !== null || val !== undefined) {
            throw new ValidationFailure(Prohibited, key, val, { msg: `field is prohibited` });
        }

        return val;

    }


    return func;

}