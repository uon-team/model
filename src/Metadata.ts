
import { Type } from './Type';

export const META_FIELDS = "uondb:fields";
export const META_MODEL = "uondb:model";
export const META_INDICES = "uondb:indices";

/**
 * 
 * @param properties A function that return a key-value map
 */
export function CreateMetadataCtor(properties?: (...args: any[]) => any) {
    return function ctor(...args: any[]) {
        if (properties) {
            const values = properties(...args);
            for (const name in values) {
                this[name] = values[name];
            }

        }
    }

}

export function GetOrDefineMetadata(metadataKey: string, obj: any, defaultValue: any = []): any {

    let annot: any = Reflect.getMetadata(metadataKey, obj);

    if (!annot) {
        annot = defaultValue;
        Reflect.defineMetadata(metadataKey, annot, obj);
    }

    return annot;
}

export function HasMetadataInstance(metaKey: string, obj: any, type: Function): boolean {

    let annot: any[] = Reflect.getMetadata(metaKey, obj);

    if(Array.isArray(annot)) {

        for(let i = 0; i < annot.length; ++i) {

            if(annot[i] instanceof type) {
                return true;
            }
        }
    }


    return false;
}