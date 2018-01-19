
import { Type } from './Type'

export class ValidationError extends Error {

    constructor(validatorType: Function, message: string) {
        super(`${validatorType.name} : ${message}`);
    }
}