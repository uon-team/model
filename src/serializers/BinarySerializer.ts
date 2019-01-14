import { Type, MakeUnique, StringUtils } from "@uon/core";
import { FindModelAnnotation, GetModelMembers, Utf8ToBase64, Base64ToUtf8 } from "../Utils";
import { Member } from "../Member";
import { ArrayMember } from "../ArrayMember";
import { TypedNumber, Int8, Int16, Int32, Uint8, Uint16, Uint32, Float32, Float64 } from "../NumberMember";



const UINT8_ARRAY_SERIALIZER = CreateArraySerializeHandler(GetSerializeHandler(Uint8));
const UINT8_ARRAY_DESERIALIZER = CreateArrayDeserializeHandler(GetDeserializeHandler(Uint8));


const BINARY_SERIALIZER_IMPL_CACHE = MakeUnique(`@uon/model/binary/impl-cache`,
    new Map<Type<any>, BinarySerializerImpl<any>>());

class BinarySerializerImpl<T> {

    private _hashCode: number;
    private _members: Member[];
    private _keys: string[];

    private _serializeStack: { [k: string]: Function } = {};
    private _deserializeStack: { [k: string]: Function } = {};

    constructor(readonly type: Type<T>) {

    }

    serialize(obj: T): ArrayBuffer {

        const buffers: ArrayBuffer[] = [];

        let size = 0;
        const stack = this._serializeStack;
        const keys = this._keys;

        const defined_indices: number[] = [];

        for (let i = 0, l = keys.length; i < l; ++i) {

            const key = keys[i]
            let val = (obj as any)[key];

            // only call func if not null or undefined
            if (val === undefined || val === null) {

                //throw new Error(`undefined and null are not yet supported in binary serialization`);
                continue;
            }

            let buffer = stack[key](val) as ArrayBuffer;
            size += buffer.byteLength;
            buffers.push(buffer);

            defined_indices.push(i);

        }

        // insert the defined indices at the start
        buffers.unshift(UINT8_ARRAY_SERIALIZER(defined_indices));

        return ConcatBuffers(buffers);
    }

    deserialize(buffer: ArrayBuffer, _offset: number = 0): T {


        let result = this._deserialize(buffer, _offset);


        return result[0];
    }

    _deserialize(buffer: ArrayBuffer, _offset: number = 0): [T, number] {

        let read_offset = _offset;

        let result: any = new this.type();

        const stack = this._deserializeStack;
        const keys = this._keys;

        // read defined indices
        let defined_result = UINT8_ARRAY_DESERIALIZER(buffer, read_offset);
        let valid_indices = defined_result[0];
        read_offset += defined_result[1];

        for (let i = 0, l = valid_indices.length; i < l; ++i) {

            const key = keys[valid_indices[i]]

            let res = stack[key](buffer, read_offset);

            result[key] = res[0];
            read_offset += res[1];

        }

        return [result, read_offset - _offset];
    }


    build() {

        const model = FindModelAnnotation(this.type);

        const members_meta = this._members = GetModelMembers(model);
        const keys = this._keys = members_meta.map((m) => {
            return m.key;
        });

        this._hashCode = StringUtils.hash(keys.join(' '));


        // go over each member meta and create grab it's type serialization function
        for (let i = 0, l = members_meta.length; i < l; ++i) {

            const member = members_meta[i];

            // handle array member
            if (member instanceof ArrayMember) {

                let serialize_handler = GetSerializeHandler(member.type);
                this._serializeStack[member.key] = CreateArraySerializeHandler(serialize_handler);

                let deserialize_handler = GetDeserializeHandler(member.type);
                this._deserializeStack[member.key] = CreateArrayDeserializeHandler(deserialize_handler);

            }
            else {

                this._serializeStack[member.key] = GetSerializeHandler(member.type);
                this._deserializeStack[member.key] = GetDeserializeHandler(member.type);
            }

        }

    }
}


/**
 * Serialize a model instance to and from ArrayBuffer
 * 
 * 
 * NOTE: null values are treated as undefined
 */
export class BinarySerializer<T> {

    private _impl: BinarySerializerImpl<T>;

    constructor(_type: Type<T>) {
        this._impl = GetOrCreateModelSerializerImpl(_type);
    }


    serialize(obj: T): ArrayBuffer {

        return this._impl.serialize(obj);
    }

    deserialize(buffer: ArrayBuffer): T {

        return this._impl.deserialize(buffer);
    }

}


function GetOrCreateModelSerializerImpl<T>(type: Type<T>) {

    let impl = BINARY_SERIALIZER_IMPL_CACHE.get(type);
    if (!impl) {
        impl = new BinarySerializerImpl<T>(type);
        BINARY_SERIALIZER_IMPL_CACHE.set(type, impl);

        impl.build();
    }

    return impl;
}

function StringToBinary(str: string): ArrayBuffer {

    let b64 = Utf8ToBase64(str);
    let len = b64.length;

    let result = new ArrayBuffer(len + 4);
    let dv = new DataView(result);

    // write string len as the first 32 bits of the buffer
    dv.setUint32(0, len);

    for (let i = 4, p = 0, l = len + 4; i < l; ++i, ++p) {
        dv.setUint8(i, b64.charCodeAt(p))
    }

    return result;

}

function ReadString(buffer: ArrayBuffer, offset: number): [string, number] {

    let dv = new DataView(buffer, offset);
    //let u8 = new Uint8Array(buffer);
    let len = dv.getUint32(0);

    let result: string = '';

    for (let i = 4, l = len + 4; i < l; ++i) {
        result += String.fromCharCode(dv.getUint8(i));
    }

    return [Base64ToUtf8(result), len + 4];
}


function BooleanToBinary(val: boolean): ArrayBuffer {

    const result = new ArrayBuffer(1);
    const dv = new DataView(result);
    dv.setUint8(0, val ? 1 : 0);
    return result;
}

function ReadBoolean(buffer: ArrayBuffer, offset: number): [boolean, number] {

    let dv = new DataView(buffer, offset);

    return [dv.getUint8(0) ? true : false, 1];
}


function DateToBinary(val: Date): ArrayBuffer {

    const result = new ArrayBuffer(8);
    const dv = new DataView(result);
    dv.setFloat64(0, val.getTime());
    return result;
}

function ReadDate(buffer: ArrayBuffer, offset: number): [Date, number] {

    let dv = new DataView(buffer, offset);
    let time = dv.getFloat64(0);
    return [new Date(time), 8];
}

function ObjectToBinary(obj: object): ArrayBuffer {

    // serialize to json str
    let str = JSON.stringify(obj);

    return StringToBinary(str);

}

function ReadObject(buffer: ArrayBuffer, offset: number): [object, number] {

    let str_result = ReadString(buffer, offset);

    let result = JSON.parse(str_result[0]);

    return [result, str_result[1]];
}



function Int8ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(1);
    const dv = new DataView(result);
    dv.setInt8(0, val);
    return result;
}

function Int16ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(2);
    const dv = new DataView(result);
    dv.setInt16(0, val);
    return result;
}


function Int32ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(4);
    const dv = new DataView(result);
    dv.setInt32(0, val);
    return result;
}


function Uint8ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(1);
    const dv = new DataView(result);
    dv.setUint8(0, val);
    return result;
}

function Uint16ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(2);
    const dv = new DataView(result);
    dv.setUint16(0, val);
    return result;
}


function Uint32ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(4);
    const dv = new DataView(result);
    dv.setUint32(0, val);
    return result;
}

function Float32ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(4);
    const dv = new DataView(result);
    dv.setFloat32(0, val);
    return result;
}

function Float64ToBuffer(val: number): ArrayBuffer {
    const result = new ArrayBuffer(8);
    const dv = new DataView(result);
    dv.setFloat64(0, val);
    return result;
}


function ReadInt8(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getInt8(0), 1];
}
function ReadInt16(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getInt16(0), 2];
}

function ReadInt32(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getInt32(0), 4];
}
function ReadUint8(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getUint8(0), 1];
}
function ReadUint16(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getUint16(0), 2];
}
function ReadUint32(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getUint32(0), 4];
}
function ReadFloat32(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getFloat32(0), 4];
}
function ReadFloat64(buffer: ArrayBuffer, offset: number): [number, number] {
    const dv = new DataView(buffer, offset);
    return [dv.getFloat64(0), 8];
}



function CreateArraySerializeHandler(handler: (value: any) => any) {
    return function array_handler(val: any[]) {

        let array_size_buffer = new ArrayBuffer(4);
        let asv = new DataView(array_size_buffer);
        asv.setUint32(0, val.length);

        let value_buffers = [array_size_buffer].concat(val.map(handler));

        return ConcatBuffers(value_buffers);
    };
}

function CreateArrayDeserializeHandler(handler: (buffer: ArrayBuffer, offset: number) => [any, number]) {
    return function array_handler(buffer: ArrayBuffer, offset: number): [any[], number] {

        const dv = new DataView(buffer, offset);
        let array_len = dv.getUint32(0);
        let read_offset = 4;
        let result: any[] = new Array(array_len);

        for (let i = 0; i < array_len; ++i) {

            let v = handler(buffer, offset + read_offset);
            result[i] = v[0];
            read_offset += v[1];
        }


        return [result, read_offset];
    };
}


function ConcatBuffers(buffers: ArrayBuffer[]): ArrayBuffer {

    let size = 0;
    for (let i = 0, l = buffers.length; i < l; ++i) {
        size += buffers[i].byteLength;
    }


    let final_buffer = new ArrayBuffer(size);


    let view = new Uint8Array(final_buffer);
    let offset = 0;
    for (let i = 0, l = buffers.length; i < l; ++i) {
        view.set(new Uint8Array(buffers[i]), offset);
        offset += buffers[i].byteLength;
    }

    return final_buffer;

}


function GetSerializeHandler(type: Type<any> | TypedNumber) {

    if (type === String) return StringToBinary;
    if (type === Boolean) return BooleanToBinary;
    if (type === Date) return DateToBinary;
    if (type === Number) return Float64ToBuffer;
    if (type instanceof TypedNumber) {
        if (type === Int8) return Int8ToBuffer;
        else if (type === Int16) return Int16ToBuffer;
        else if (type === Int32) return Int32ToBuffer;
        else if (type === Uint8) return Uint8ToBuffer;
        else if (type === Uint16) return Uint16ToBuffer;
        else if (type === Uint32) return Uint32ToBuffer;
        else if (type === Float32) return Float32ToBuffer;
        else if (type === Float64) return Float64ToBuffer;
    }

    // test if we have a model
    if (FindModelAnnotation(type as Type<any>)) {
        let impl = GetOrCreateModelSerializerImpl(type as Type<any>);
        return impl.serialize.bind(impl);
    }

    // finally handle plain object, just using identity for now
    if (type === Object) {
        return ObjectToBinary;
    }

    throw new Error(`${type.name} is not a supported type`);
}


function GetDeserializeHandler(type: Type<any> | TypedNumber) {

    if (type === String) return ReadString;
    if (type === Boolean) return ReadBoolean;
    if (type === Date) return ReadDate;
    if (type === Number) return ReadFloat64;
    if (type instanceof TypedNumber) {
        if (type === Int8) return ReadInt8;
        else if (type === Int16) return ReadInt16;
        else if (type === Int32) return ReadInt32;
        else if (type === Uint8) return ReadUint8;
        else if (type === Uint16) return ReadUint16;
        else if (type === Uint32) return ReadUint32;
        else if (type === Float32) return ReadFloat32;
        else if (type === Float64) return ReadFloat64;
    }

    // test if we have a model
    if (FindModelAnnotation(type as Type<any>)) {
        let impl = GetOrCreateModelSerializerImpl(type as Type<any>);
        return impl._deserialize.bind(impl);
    }

    // finally handle plain object, just using identity for now
    if (type === Object) {
        return ReadObject;
    }

    throw new Error(`${type.name} is not a supported type`);
}