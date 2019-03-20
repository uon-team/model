
import { Type, TypeDecorator, MakeTypeDecorator, GetPropertiesMetadata, MakeUnique, PropDecorator } from '@uon/core'
import { Member, ID } from './Member';
import { ArrayMember } from './ArrayMember';
import { Mutations } from './Mutation';


// a weak map to keep dirty fields for models
const DIRTY_FIELDS_WEAPMAP = new WeakMap<object, { [k: string]: boolean }>();

// a weakmap to keep data
const DATA_WEAKMAP: WeakMap<object, any> = new WeakMap<object, any>();

export interface ModelDecorator {
    (): TypeDecorator;
    new(): Model;

    /**
     * Clear all dirty flags from a model instance
     * @param obj 
     */
    MakeClean<T>(obj: T): void;

    /**
     * Get a list of dirty properties from a model instance
     * @param obj 
     */
    GetMutations<T>(obj: T): Mutations<T>;
}



export interface ModelOptions {


}


/**
 * 
 */
export const Model: ModelDecorator = MakeUnique(`@uon/model/Model`,
    MakeTypeDecorator("Model",
        () => ({}),
        null,
        (target: Type<any>, meta: Model) => {

            // assign type to model
            meta.type = target;

            // get property annotations map
            const properties_meta: any = GetPropertiesMetadata(target.prototype) || {};
            meta.properties = properties_meta;


            // the unique ID field
            let id_meta: ID;

            // go over all decorated properties
            for (let name in properties_meta) {

                // get member decoration only
                const filtered: Member[] = properties_meta[name].filter((a: any) => {
                    return a instanceof Member;
                });

                // can only have one Member type decorator on a property
                if (filtered.length > 1) {
                    throw new Error(`Can only have 1 Member decorator on a property, got ${filtered.length} on ${target.name}.${name}`);
                }

                if (filtered.length === 1) {
                    let m = filtered[0];

                    // check if this is an ID
                    if (m instanceof ID) {

                        // ID already set, this is a user error
                        if (meta.id) {
                            throw new Error(`Model: ${target.name} has more then 1 ID() decorator.`);
                        }

                        meta.id = m;

                    }

                    // replace field with getter setter
                    ReplacePropertyWithGetterSetter(target.prototype, name, m);
                }

            }

            // return the original class target
            return target;

        }));

/**
 * Declare a class as a Model to enable validation and typed serialization
 */
export interface Model {
    type: Type<any>;
    properties: { [k: string]: any[] }
    id: ID;
}

// MakeClean implementation
Model.MakeClean = function MakeClean<T>(obj: T): void {

    const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, obj as any);
    let keys = Object.keys(dirty);
    keys.forEach((k) => {
        delete dirty[k];
    });
}

// GetDirty implementation
Model.GetMutations = function GetMutations<T>(obj: T): Mutations<T> {
    const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, obj as any);
    return dirty;

}


/**
 * Apply member decorators to an existing non-decorated class.
 * 
 * @param cls 
 * @param def 
 */
export function Modelize<T>(cls: Type<T>, def: { [K in keyof T]: T[K] extends Function ? never : PropDecorator }) {

    const model_decorator = Model();
    const proto = cls.prototype;

    for (let key in def) {
        const dec = def[key];
        dec(proto, key);
    }

    // call model decorator
    model_decorator(cls);
}


/**
 * @private
 * Replaces a property with a getter and setter
 * @param target 
 * @param key 
 * @param annotations 
 */
function ReplacePropertyWithGetterSetter(target: any, key: string, member: Member) {

    // no member meta defined, no bueno
    if (!member) {
        return;
    }

    // property getter
    const getter = function () {
        const data = GetOrDefineInWeakMap(DATA_WEAKMAP, this);
        return data[key];
    };

    // property setter
    const setter = member instanceof ArrayMember
        ? CreateArraySetter(key)
        : CreateGenericSetter(key);

    // delete property.
    if (delete target[key]) {

        // Create new property with getter and setter
        Object.defineProperty(target, key, {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true
        });
    }

}

function CreateGenericSetter(key: string) {

    return function generic_setter(val: any) {

        const data = GetOrDefineInWeakMap(DATA_WEAKMAP, this);
        const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, this);

        // set field as dirty
        dirty[key] = true;

        // set new value
        data[key] = val;
    }
}

function CreateArraySetter(key: string) {

    return function array_setter(val: any) {

        const data = GetOrDefineInWeakMap(DATA_WEAKMAP, this);
        const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, this);

        if (val) {
            val = new Proxy(val, GetArrayProxyHandler(this, key));
        }

        // set field as dirty
        dirty[key] = true;

        // set new value
        data[key] = val;
    }
}


const ARRAY_MUTATION_FUNC_NAMES = ['push', 'unshift', 'pop', 'shift', 'splice'];
/**
 * @private
 * Generate a ProxyHandler for an array field
 * @param inst 
 * @param key 
 */
function GetArrayProxyHandler(inst: any, key: string): ProxyHandler<any> {

    const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, inst);

    return {
        get(target, prop) {
            const val = target[prop];
            const func_name = prop as string;
            if (typeof val === 'function') {
                if (ARRAY_MUTATION_FUNC_NAMES.indexOf(prop as string) > -1) {
                    return function () {

                        if (dirty[key] !== true) {
                            dirty[key] = dirty[key] || [];
                            dirty[key].push({ op: prop as string, args: arguments });
                        }

                        return (Array.prototype as any)[func_name].apply(target, arguments);
                    }
                }

                return val.bind(target);
            }

            return val;
        },

        set(target, prop, val, receiver) {

            target[prop] = val;

            if (dirty[key] !== true) {
                dirty[key] = dirty[key] || [];
                dirty[key].push({ op: 'set', args: [prop as number] });
            }


            return true;
        }
    };
}



/**
 * 
 * @param map 
 * @param key 
 */
function GetOrDefineInWeakMap(map: WeakMap<object, any>, key: object) {

    let data = map.get(key);
    if (!data) {
        data = {}
        map.set(key, data);
    }

    return data;
}