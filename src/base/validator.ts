import { Injector } from "@uon/core";



//export type Validator = (model: any, key: string, val: any, injector?: Injector) => any;

export interface Validator {

    (model: any, key: string, val: any, injector?: Injector): any;

    _forceValidation?: boolean;
    _fieldValidators?: { [k: string]: Validator[] }
}