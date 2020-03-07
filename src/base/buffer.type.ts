

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
