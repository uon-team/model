



import { ValidationFailure } from '../Validate';
import { Injectable } from '@uon/core';


export function Required() {

    const func = function required(model: any, key: string, val: any) {

        if (val === null || val === undefined) {
            throw new ValidationFailure(Required, key, val, `field is required`);
        }

        return val;

    }

    func._forceValidation = true;

    return func;

}