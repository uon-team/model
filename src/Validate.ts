
import { Type, MakePropertyDecorator } from '@uon/core';



export interface ValidateDecorator {
    (validators?: Function[]): PropertyDecorator;
    new(validators?: Function[]): Validate
}

export interface Validate {

    validators?: ((model: any, key: string, val: any) => boolean)[];
}

export const Validate: ValidateDecorator =
    MakePropertyDecorator("Validate", (validators: ((model: any, key: string, val: any) => boolean)[]) => ({ validators }));
