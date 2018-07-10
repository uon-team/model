

import {
    Type,
    GetMetadata,
    GetOrDefineMetadata,
    CreateMetadataCtor,
    FindMetadataOfType,
    META_PROPERTIES,
    META_ANNOTATIONS
} from '@uon/core'


/**
 * The metadata for a model's serializable field
 */
export interface Field {

    key: string;
    type?: Type<any>;
    arrayType?: Type<any>;

}


export function Field(arrayType?: Type<any>) {

    const meta_ctor = CreateMetadataCtor((arrayType: Type<any>) => ({ arrayType }));
    if (this instanceof Field) {
        meta_ctor.apply(this, arguments);
        return this;
    }


    return function FieldDecorator(target: any, key: string) {

        // get the field type 
        let type: Type<any> = GetMetadata('design:type', target, key);

        // Ensure that an array type has been provided for arrays
        // since the Reflect library doesnt support it yet
        if (type == Array && !arrayType) {
            throw new Error("You must provide the type of array elements as the decorator argument.");
        }

        // get the fields meta object
        let annotations: any = GetOrDefineMetadata(META_PROPERTIES, target, {});

        // create a new instance of the field metadata
        let field_instance = new (Field as any)(arrayType);
        field_instance.key = key;
        field_instance.type = type;

        // add field meta to field annotations
        annotations[key] = annotations[key] || [];
        annotations[key].push(field_instance);



    }
}


/**
 * Represents the primary key of a model
 */
export interface ID {
    key: string;
    type: Type<any>;
}



export function ID() {

    const meta_ctor = CreateMetadataCtor((key: string, type: Type<any>) => ({ key, type }));
    if (this instanceof ID) {
        meta_ctor.apply(this, arguments);
        return this;
    }


    return function IDDecorator(target: any, key: string) {

        // get the field type 
        let type: Type<any> = GetMetadata('design:type', target, key);


        // get the fields meta object
        let annotations: any = GetOrDefineMetadata(META_PROPERTIES, target, {});

        // create a new instance of the id metadata
        let id_instance = new (ID as any)(key, type);

        // add field meta to field annotations
        annotations[key] = annotations[key] || [];
        annotations[key].push(id_instance);



    }
}