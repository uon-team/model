
import { Type } from '@uon/core';

export class ValidationError extends Error {

    constructor(
        readonly validator: Function,
        readonly target: any,
        readonly key: string,
        readonly value: any,
        readonly message: string
    ) {
        super(`${validator.name} - ${message}`);
    }
}