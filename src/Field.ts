

import { Type } from './Type';
import { GetOrDefineMetadata, CreateMetadataCtor, HasMetadataInstance, META_FIELDS, META_MODEL } from './Metadata'
import { Collection } from './Collection';


export interface Field {

    key: string;
    type?: Type<any>;
    arrayType?: Type<any>;
    isDBRef?: boolean;

}


export function Field(arrayType?: Type<any>) {

    const meta_ctor = CreateMetadataCtor((arrayType: Type<any>) => ({ arrayType }));
    if (this instanceof Field) {
        meta_ctor.apply(this, arguments);
        return this;
    }


    return function FieldDecorator(target: any, key: string) {

        // get the field type 
        let type: Type<any> = Reflect.getMetadata('design:type', target, key);

        // Ensure that an array type has been provided for arrays
        // since the Reflect library doesnt support it yet
        if(type == Array && !arrayType) {
            throw new Error("You must provide the type of array elements as the decorator argument.");
        }

        // get the fields meta object
        let annotations: any = GetOrDefineMetadata(META_FIELDS, target, {});

        // create a new instance of the field metadata
        let field_instance = new (Field as any)(arrayType);
        field_instance.key = key;
        field_instance.type = type;

        // should we just keep the collection object?
        field_instance.isDBRef = HasMetadataInstance(META_MODEL, arrayType || type, Collection);

        
        // add field meta to field annotations
        annotations[key] = annotations[key] || [];
        annotations[key].push(field_instance);



    }
}