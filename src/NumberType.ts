

import {
    Type,
    GetMetadata,
    MakePropertyDecorator
} from '@uon/core'



export enum NType {
    Int8 = 100,
    Int16,
    Int32,
    Int64,
    Uint8,
    Uint16,
    Uint32,
    Uint64,
    Float32,
    Float64
}

export interface NumberTypeDecorator {
    (type: NType): PropertyDecorator;
    new(type: NType): NumberType
}

/**
 * The metadata for a model's serializable field
 */
export interface NumberType {

    type: NType;

}

export const NumberType: NumberTypeDecorator = MakePropertyDecorator("NumberType", (type: NType) => ({ type }), null,
    (target: any, meta: NumberType, key: string) => {

        // get the field type 
        let type: Type<any> = GetMetadata('design:type', target, key);

        if (type != Number) {
            throw new Error(`NumberType decorator can only be declared on property with type Number`);
        }

    });



