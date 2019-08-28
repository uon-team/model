
import { Type, GetTypeMetadata, MakeUnique } from '@uon/core';
import { Member, ID } from '../Member';
import { TypedNumber, NumberMember } from '../NumberMember';
import { ArrayMember } from '../ArrayMember';
import { FindModelAnnotation, GetModelMembers, IsTypedArrayType } from '../Utils';
import { ClearMutations, GetMutations } from '../Mutation';

const JSON_SERIALIZER_IMPL_CACHE = MakeUnique(`@uon/model/json/impl-cache`,
    new Map<Type<any>, JsonSerializerImpl<any>>());


class JsonSerializerImpl<T> {

    private _serializeStack: { [k: string]: Function } = {};
    private _deserializeStack: { [k: string]: Function } = {};

    constructor(readonly type: Type<T>) {

    }

    serialize(obj: T, mutationsOnly: boolean = false): object {

        const mutations = GetMutations(obj);
        let stack = this._serializeStack;
        const result: any = {};

        if (mutationsOnly) {
            stack = {};
            for (let key in mutations) {
                stack[key] = this._serializeStack[key];
            }
        }

        for (let key in stack) {

            let val = (obj as any)[key];

            // only call func if not undefined
            if (val !== undefined) {
                // we treat null as a valid value here, we just don't pass it thru 
                // the serialization function
                val = val !== null ? stack[key](val) : null;
                result[key] = val;
            }


        }

        return result;
    }

    deserialize(obj: object, clearMutations: boolean = true): T {

        const stack = this._deserializeStack;
        const result: any = new (this.type as any)();
        for (let key in stack) {

            let val = (obj as any)[key];

            // only call func if value is not undefined
            // as with serialization, we treat null as a valid value
            if (val !== undefined) {
                val = val !== null ? stack[key](val) : null;
                result[key] = val;
            }
        }

        // clear dirty fields as this is a brand new instance
        if (clearMutations) {
            ClearMutations(result);
        }


        return result as T;
    }

    build() {

        // grab model metadata
        const model_meta = FindModelAnnotation(this.type);

        // needs model decoration to exist
        if (!model_meta) {
            throw new Error(`Provided type ${this.type.name} has not been decorated with @Model()`)
        }

        // grab members metadata
        const members_meta: Member[] = GetModelMembers(model_meta);

        // go over each member meta and create it's type serialization function
        for (let i = 0, l = members_meta.length; i < l; ++i) {

            const member = members_meta[i];

            // handle array member
            if (member instanceof ArrayMember) {

                let serialize_handler = GetSerializeHandler(member.type);
                this._serializeStack[member.key] = CreateArrayHandler(serialize_handler);

                let deserialize_handler = GetDeserializeHandler(member.type);
                this._deserializeStack[member.key] = CreateArrayHandler(deserialize_handler);

            }
            else {
                this._serializeStack[member.key] = GetSerializeHandler(member.type);
                this._deserializeStack[member.key] = GetDeserializeHandler(member.type);
            }


        }



    }


}


/**
 * Serializer/Deserializer for a specific Model type
 */
export class JsonSerializer<T> {

    private _impl: JsonSerializerImpl<T>;

    constructor(private _type: Type<T>) {

        this._impl = GetOrCreateModelSerializerImpl(_type);
    }

    /**
     * Serialize a modeled value to a plain js object
     * @param val
     * @param mutationsOnly 
     */
    serialize(val: T, mutationsOnly: boolean = false): object {
        return this._impl.serialize(val, mutationsOnly);
    }

    /**
     * Deserialize a value to the provided type
     * @param type 
     * @param val 
     */
    deserialize(val: object, clearMutations: boolean = true): T {
        return this._impl.deserialize(val, clearMutations);
    }


}



function CreateArrayHandler(handler: (value: any) => any) {
    return function array_handler(val: any[]) {
        val = Array.isArray(val) ? val : [val]; // convert to array here
        return val.map((v) => { return handler(v) });
    };
}

function GetOrCreateModelSerializerImpl<T>(type: Type<T>) {

    let impl = JSON_SERIALIZER_IMPL_CACHE.get(type);
    if (!impl) {
        impl = new JsonSerializerImpl<T>(type);
        JSON_SERIALIZER_IMPL_CACHE.set(type, impl);

        impl.build();
    }

    return impl;
}

function StringHandler(val: string) {
    return val;
}

function BooleanHandler(val: boolean) {
    return val;
}

function NumberHandler(val: number) {
    return val;
}

function DateHandler(val: Date) {
    return new Date(val);
}


function GetSerializeHandler(type: Type<any>) {

    if (type === String) return StringHandler;
    if (type === Boolean) return BooleanHandler;
    if (type === Date) return DateHandler;
    if (type === Number) return NumberHandler;
    if ((type as any).__TypedNumber === true) return NumberHandler;


    /* 
  if (IsTypedArrayType(type)) {

  }*/

    // test if we have a model
    if (FindModelAnnotation(type)) {
        let impl = GetOrCreateModelSerializerImpl(type);
        return impl.serialize.bind(impl);
    }

    // finally handle plain object, just using identity for now
    if (type === Object) {
        return (v: any) => { return v; }
    }

    throw new Error(`${type.name} is not a supported type`);
}


function GetDeserializeHandler(type: Type<any>) {

    if (type === String) return StringHandler;
    if (type === Boolean) return BooleanHandler;
    if (type === Date) return DateHandler;
    if (type === Number) return NumberHandler;
    if ((type as any).__TypedNumber === true) return NumberHandler;

    /* 
    if (IsTypedArrayType(type)) {

    }*/

    // test if we have a model
    if (FindModelAnnotation(type)) {
        let impl = GetOrCreateModelSerializerImpl(type);
        return impl.deserialize.bind(impl);
    }

    // finally handle plain object, just using identity for now
    if (type === Object) {
        return (v: any) => { return v; }
    }

    throw new Error(`${type.name} is not a supported type`);
}
