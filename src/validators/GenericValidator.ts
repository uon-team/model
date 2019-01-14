



import { ValidationFailure } from '../Validate';


export function Required() {

    return function (model: any, key: string, val: any) {

        if (val === null || val === undefined) {
            throw new ValidationFailure(Required, key, val, `a value is required`);
        }

        return val;

    }

}