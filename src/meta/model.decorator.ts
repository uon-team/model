
import { Type, TypeDecorator, MakeTypeDecorator, GetPropertiesMetadata, MakeUnique, PropDecorator, PropertyNamesNotOfType } from '@uon/core'
import { Member, ID } from './member.decorator';
import { ArrayMember } from './array.decorator';
import { Mutations, ClearMutations, GetMutations, MakeDirty } from '../base/mutation';
import { JsonSerializer } from '../serializers/json.serializer';
import { Validator } from '../base/validation';
import { MODEL_DECORATOR_NAME, DATA_SYMBOL, MUT_SYMBOL } from '../base/constants';
import { GetOrSet } from '../utils/getset';


export interface ModelDecorator {
    (options?: ModelOptions): TypeDecorator;
    new(options?: ModelOptions): Model;

    /**
     * Clear all mutation flags from a model instance
     * @param obj 
     */
    MakeClean<T>(obj: T, fields?: string[]): void;

    MakeDirty<T>(obj: T, key: keyof T): void;

    /**
     * Get a list of mutations since last cleanup from a model instance
     * @param obj 
     */
    GetMutations<T>(obj: T): Mutations<T>;


    /**
     * Helper for instanciating
     * @param type 
     * @param data 
     */
    New<T>(type: Type<T>, data: Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>): T;

}



export interface ModelOptions {

    version?: number;
    name?: string;
    description?: string;

    [k: string]: any;

}



/**
 * 
 */
export const Model: ModelDecorator = MakeUnique(MODEL_DECORATOR_NAME,
    MakeTypeDecorator(MODEL_DECORATOR_NAME,
        (options?: ModelOptions) => options,
        null,
        (target: Type<any>, meta: Model) => {

            // assign type to model
            meta.type = target;

            // keep a list of validators handy
            meta.validators = {};

            // get property annotations map
            const own_properties_meta: any = GetPropertiesMetadata(target.prototype) || {};
            const all_properties_meta = Object.assign({},
                own_properties_meta,
                FindParentClassPropDecorators(target, Object.keys(own_properties_meta))
            );

            meta.properties = all_properties_meta;

            // go over all decorated properties
            for (let name in all_properties_meta) {

                // get member decoration only
                const filtered: Member[] = all_properties_meta[name].filter((a: any) => {
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
                        if (meta.id) {
                            throw new Error(`${target.name} cannot have more than 1 ID decorator.`);
                        }
                        meta.id = m;
                    }

                    if (m.validators) {
                        meta.validators[m.key] = m.validators;
                    }

                    // replace field with getter setter
                    if (name in own_properties_meta) {
                        ReplacePropertyWithGetterSetter(target.prototype, name, m);
                    }

                }

            }

            const serializer = new JsonSerializer(target);

            // Define a toJSON method to simplify serialization when using JSON.stringify
            target.prototype.toJSON = function () {
                return serializer.serialize(this);
            };

            // return the original class target
            return target;

        }));

/**
 * Declare a class as a Model to enable validation and typed serialization
 */
export interface Model extends ModelOptions {
    type: Type<any>;
    properties: { [k: string]: any[] };
    validators: { [k: string]: Validator[] };
    id: ID;
}

// MakeClean implementation
Model.MakeClean = ClearMutations;

Model.MakeDirty = MakeDirty;

// GetMutations implementation
Model.GetMutations = GetMutations;

// New helper
Model.New = function _Instanciate<T>(type: Type<T>, data: Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>) {
    return Object.assign(new type, data);
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
        const data = GetOrSet(this, DATA_SYMBOL);
        return data[key];
    };

    // property setter
    const setter = member instanceof ArrayMember
        ? CreateArraySetter(key)
        : member instanceof ID
            ? CreateForeverCleanSetter(key)
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


function CreateForeverCleanSetter(key: string) {

    return function clean_setter(val: any) {
        GetOrSet(this, DATA_SYMBOL)[key] = val;
    }
}

function CreateGenericSetter(key: string) {

    return function generic_setter(val: any) {

        const data = GetOrSet(this, DATA_SYMBOL);
        const dirty = GetOrSet(this, MUT_SYMBOL);

        // only if value has changed
        if (data[key] !== val) {
            dirty[key] = true;
            data[key] = val;
        }

    }
}

function CreateArraySetter(key: string) {

    return function array_setter(val: any) {

        const data = GetOrSet(this, DATA_SYMBOL);
        const dirty = GetOrSet(this, MUT_SYMBOL);

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

    const dirty = GetOrSet(inst, MUT_SYMBOL);

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
                dirty[key].push({ op: 'set', args: [prop] });
            }


            return true;
        }
    };
}


function FindParentClassPropDecorators<T>(type: Type<T>, ignore: string[]) {

    const parent = Object.getPrototypeOf(type.prototype);
    const props = GetPropertiesMetadata(parent) || {};

    const result: { [k: string]: any[] } = {};

    for (let i in props) {
        if (ignore.indexOf(i) === -1) {
            result[i] = props[i];
        }
    }

    return result;

}


