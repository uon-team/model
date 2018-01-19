

import { Type } from './Type';
import { GetOrDefineMetadata, CreateMetadataCtor, META_FIELDS } from './Metadata'


export interface Validate {

    validators?: ((model: any, key: string, val: any) => boolean) [];
    

}


export function Validate(validators?: Function[]) {

    const meta_ctor = CreateMetadataCtor((validators: Type<any>[]) => ({ validators }));
    if (this instanceof Validate) {
        meta_ctor.apply(this, arguments);
        return this;
    }


    return function ValidateDecorator(target: any, key: string) {

        // get the fields meta object
        let annotations: any = GetOrDefineMetadata(META_FIELDS, target, {});

        // create a new instance of the field metadata
        let validate_instance = new (Validate as any)(validators);
        
        
        // add field meta to field annotations
        annotations[key] = annotations[key] || [];
        annotations[key].push(validate_instance);



    }
}