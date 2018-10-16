


import { Type } from '@uon/core';

declare var global: any;

let GLOBAL: any;

try {
    GLOBAL = global;
}
catch(ex) {
    GLOBAL = window;
}

// define unique collection storage, experimental
const TYPE_STORAGE_KEY = Symbol.for(`@uon/model/type-manager`);
if (!GLOBAL[TYPE_STORAGE_KEY]) {
    GLOBAL[TYPE_STORAGE_KEY] = new Map<Type<any>, any>();
}
const TYPE_STORAGE =  GLOBAL[TYPE_STORAGE_KEY];



export interface TypeDefinition<T> {

    serialize?: (v: T) => any;
    deserialize?: (v: any) => T;
    validate?: (v: any) => boolean;
    keys?: string[];

}

export class TypeManager {

   // static readonly TYPES: Map<Type<any>, any> = new Map();


    /**
     * Register a type for de/serialization
     * @param type 
     * @param def 
     */
    static Register<T>(type: Type<T>, def: TypeDefinition<T>) {

        TYPE_STORAGE.set(type, def);
    }

    /**
     * Check if a type has been registered
     * @param type 
     */
    static HasType<T>(type: Type<T>) {
        return TYPE_STORAGE.has(type);
    }

    /**
     * Serialize an object
     * @param obj 
     */
    static Serialize<T>(type: Type<any>, obj: T | T[]): any {

        const def = TYPE_STORAGE.get(type);

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
        const def = TYPE_STORAGE.get(type);

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

    static Validate<T>(type: Type<T>, obj: any): boolean {

        const def = TYPE_STORAGE.get(type);

        if (def.validate) {



        }


        return true;
    }
}


TypeManager.Register(Number, {

    serialize(value: Number) {
        return value;
    },

    deserialize(value: any): Number {
        return value
    }
});

TypeManager.Register(Boolean, {

    serialize(value: Boolean) {
        return value;
    },

    deserialize(value: any): Boolean {
        return value
    }
});

TypeManager.Register(String, {

    serialize(value: string) {
        return value;
    },

    deserialize(value: any): string {
        return value;
    }
});

TypeManager.Register(Date, {

    serialize(value: Date) {
        return value;
    },

    deserialize(value: any): Date {
        return new Date(value);
    }
});

TypeManager.Register(Object, {

    serialize(value: Object) {

        let source: any = value;
        let result: any = {};

        for(let i in source) {

            let val = source[i]

            if(val === undefined) {
                continue;   
            }

            if(val === null) {
                result[i] = null;
            }
            else {
                let type = val.constructor;
                result[i] = TypeManager.Serialize(type, source[i]);
            }
            
        }

        return result;
    },

    deserialize(value: any): Object {
        return value;
    }
});


