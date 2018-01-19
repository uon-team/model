


import { Type } from './Type';
import { ObjectId } from 'bson';



export interface TypeDefinition<T> {

    serialize?: (v: T) => any;
    deserialize?: (v: any) => T;
    keys?: string[];

}

export class TypeManager {

    static readonly TYPES: Map<Type<any>, any> = new Map();


    /**
     * Register a type for de/serialization
     * @param type 
     * @param def 
     */
    static Register<T>(type: Type<T>, def: TypeDefinition<T>) {

        this.TYPES.set(type, def);
    }

    /**
     * Check if a type has been registered
     * @param type 
     */
    static HasType<T>(type: Type<T>) {
        return this.TYPES.has(type);
    }

    /**
     * Serialize an object
     * @param obj 
     */
    static Serialize<T>(type: Type<any>, obj: T | T[]): any {

        const def = this.TYPES.get(type);

        if (!def) {
            throw new Error(`TypeManager : Type ${type.name} is not defined`);
        }

        if (def.serialize) {

            if (Array.isArray(obj)) {

                let a_res = [];
                for (let i = 0; i < obj.length; ++i) {
                    a_res.push(def.serialize(obj[i]));
                }
                return a_res;

            }

            return def.serialize(obj);
        }
        else if (def.keys) {
            
            let result: any = {};

            for (let i = 0; i < def.keys.length; ++i) {
                let k = def.keys[i];
                result[k] = (obj as any)[k];
            }
            return result;
        }
        else {
            throw new Error(`TypeManager : Neither serialize or keys have been registered`);
        }

    }

    /**
     * Deserialize an object to the provided type
     * @param type 
     * @param obj 
     */
    static Deserialize<T>(type: Type<T>, obj: any): T | T[] {

        //const ctor: any = (obj as any).constructor;
        const def = this.TYPES.get(type);

        if (!def) {
            throw new Error(`TypeManager : Type ${type.name} is not defined`);
        }

        if (def.deserialize) {

            if (Array.isArray(obj)) {

                let a_res = [];
                for (let i = 0; i < obj.length; ++i) {
                    a_res.push(def.deserialize(obj[i]));
                }
                return a_res;

            }

            return def.deserialize(obj);
        }
        else if (def.keys) {

            let instance = new (type as any)();

            for (let i = 0; i < def.keys.length; ++i) {
                let key = def.keys[i];
                instance[key] = obj[key];
            }

            return instance;
        }
        else {
            throw new Error(`TypeManager : deserialize has not been registered for type ${type.name}`);
        }

    }
}

// Register ObjectId
TypeManager.Register(ObjectId, {

    serialize(value: ObjectId) {
        return value;
    },

    deserialize(value: any): ObjectId {
        return new ObjectId(value)
    }
});

TypeManager.Register(Number, {

    serialize(value: Number) {
        return value;
    },

    deserialize(value: any): Number {
        return value
    }
});

TypeManager.Register(String, {

    serialize(value: string) {
        return value;
    },

    deserialize(value: any): string {
        return value
    }
});