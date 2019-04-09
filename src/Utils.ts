import { Type, GetTypeMetadata, GLOBAL } from "@uon/core";
import { Model } from "./Model";
import { Member } from "./Member";


declare function atob(str: string): string;
declare function btoa(str: string): string;

/**
 * Given a type, find a @Model annotation
 * @param annotations 
 */
export function FindModelAnnotation<T>(type: Type<T>): Model {

    const annotations = GetTypeMetadata(type);
    for (let i = 0, l = annotations.length; i < l; ++i) {
        if (annotations[i] instanceof Model) {
            return annotations[i];
        }
    }

    return null;
}


/**
 * Get all @Member property annotations for a given Model metadata
 * @param model 
 */
export function GetModelMembers(model: Model): Member[] {

    const annotations = model.properties;
    const members_meta: Member[] = [];
    for (let name in annotations) {
        let member = ExtractMetaFromArray(annotations[name], Member);
        if (member) {
            members_meta.push(member);
        }
    }

    return members_meta;

}


/**
 * 
 * @param arr 
 * @param type 
 * @private
 */
function ExtractMetaFromArray(arr: any[], type: any) {

    for (let i = 0; i < arr.length; ++i) {

        if (arr[i] instanceof type) {
            return arr[i];
        }
    }

    return null;
}



declare var Buffer: any;


export function Utf8ToBase64(str: string): string {
    if (GLOBAL.atob) {
        return atob(str);
    }
    else {
        return Buffer.from(str, 'utf8').toString('base64');
    }
}


export function Base64ToUtf8(str: string): string {
    if (GLOBAL.atob) {
        return btoa(str);
    }
    else {
        return Buffer.from(str, 'base64').toString('utf8');
    }
}

const TYPED_ARRAY_TYPES = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
];

export function IsTypedArrayType(type: any) {

    return TYPED_ARRAY_TYPES.indexOf(type) > -1;

}

