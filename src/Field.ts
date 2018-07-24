

import {
    Type,
    GetMetadata,
    MakePropertyDecorator
} from '@uon/core'


export interface FieldDecorator {
    (arrayType?: Type<any>): PropertyDecorator;
    new(arrayType?: Type<any>): Field
}

/**
 * The metadata for a model's serializable field
 */
export interface Field {

    key: string;
    type?: Type<any>;
    arrayType?: Type<any>;

}

export const Field: FieldDecorator = MakePropertyDecorator("Field", (arrayType: Type<any>) => ({ arrayType }), null,
    (target: any, meta: Field, key: string) => {

        // get the field type 
        let type: Type<any> = GetMetadata('design:type', target, key);

        // Ensure that an array type has been provided for arrays
        // since the Reflect library doesnt support it yet
        if (type == Array && !meta.arrayType) {
            throw new Error("You must provide the type of array elements as the decorator argument.");
        }

        meta.key = key;
        meta.type = type;

    });






export interface IDDecorator {
    (): PropertyDecorator;
    new(key: string, type: Type<any>): ID
}

/**
 * Represents the primary key of a model
 */
export interface ID {
    key: string;
    type: Type<any>;
}


export const ID: IDDecorator = MakePropertyDecorator("ID", (key: string, type: Type<any>) => ({ key, type }), null,
    (target, meta: ID, key: string) => {

        // get the field type 
        let type: Type<any> = GetMetadata('design:type', target, key);

        meta.key = key;
        meta.type = type;

    });

