
import { Type, GetOrDefineMetadata, CreateMetadataCtor, META_PROPERTIES, META_ANNOTATIONS, GetMetadata } from '@uon/core'
import { Field, ID } from './Field';
import { Validate } from './Validate';
import { TypeManager } from './TypeManager';


// a weak map to keep dirty fields for models
const DIRTY_FIELDS_WEAPMAP = new WeakMap();

// a weakmap to keep data
const DATA_WEAKMAP: WeakMap<object, any> = new WeakMap<object, any>();


/**
 * Model interface
 */
export interface Model {
    type: Type<any>;
    fields: { [k: string]: any[] }
    idField: ID;
}


/**
 * Model decorator
 * @param args 
 */
export function Model(...args: any[]) {

    const meta_ctor = CreateMetadataCtor((fields: any) => ({ fields }));
    if (this instanceof Model) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function ModelDecorator(target: Type<any>) {

        // get the fields meta object
        let annotations: any[] = GetOrDefineMetadata(META_ANNOTATIONS, target, []);

        // get all defined field
        let fields: any = GetOrDefineMetadata(META_PROPERTIES, target.prototype, {});

        // create a new instance of the field metadata
        let model_instance = new (Model as any)(fields);
        model_instance.type = target;

        annotations.push(model_instance);

        let id_field: ID;

        // replace member with getter setter
        for (let name in fields) {

            let model_annotations = fields[name];

            // try an find an ID field
            const id = ExtractMetaFromArray(fields[name], ID);
            if(id) {

                // we can only have a single ID field
                if(id_field) {
                    throw new Error(`Model: ${target.name} has more then 1 ID() decorator.`);
                }

                model_instance.idField = id;
                id_field = id;
            }
            

            // replace field with getter setter
            ReplacePropertyWithGetterSetter(target.prototype, name, model_annotations);

        }

        // build a serialization function for this model
        const serialize = GetModelSerializeFunction(target, fields);

        // build a deserialization function for this model
        const deserialize = GetModelDeserializeFunction(target, fields);

        // Register type with type manager
        TypeManager.Register(target, { serialize, deserialize });

        // return the original class target
        return target;
    }
}

/**
 * Get a list of Field metadata from the Model metadata
 * @param m 
 */
export function GetModelFieldList(m: Model) {

    let result: Field[] = []
    for (let key in m.fields) {
        result.push(ExtractMetaFromArray(m.fields[key], Field));
    }

    return result.filter(v => v !== null);
}

/**
 * Reset the dirty fields on an object
 * @param m 
 */
export function ClearModelDirtyFields<T>(m: T) {

    const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, m as any);

    let keys = Object.keys(dirty);
    keys.forEach((k) => {
        delete dirty[k];
    });
}

/**
 * Retrieve the dirty fields as key/value map
 * @param m 
 */
export function GetModelDirtyFields<T>(m: T) {

    const dirty = DIRTY_FIELDS_WEAPMAP.get(m as any);
    return dirty;
}




/**
 * @private
 * Replaces a property with a getter and setter
 * @param target 
 * @param key 
 * @param annotations 
 */
function ReplacePropertyWithGetterSetter(target: any, key: string, annotations: any[]) {

    let field: Field | ID;
    let id: ID;
    let validators: Validate;

    for (let i = 0; i < annotations.length; i++) {
        let a = annotations[i];
        if (a instanceof Validate) {
            validators = a;
        }
        else if (a instanceof Field) {
            field = a;
        }
        else if (a instanceof ID) {
            field = a;
        }
    }

    // no field defined, no bueno
    if (!field) {
        return;
    }

    // property getter
    const getter = function () {
        const data = GetOrDefineInWeakMap(DATA_WEAKMAP, this);
        return data[key];
    };

    // property setter
    const setter = function (newVal: any) {

        const data = GetOrDefineInWeakMap(DATA_WEAKMAP, this);
        const dirty = GetOrDefineInWeakMap(DIRTY_FIELDS_WEAPMAP, this);

        let old_val = data[key];
        let val: any = newVal;

        // execute validators
        if (validators) {
            let errors = ExecuteValidators(this, key, val, validators.validators);
            if (errors.length) {
                throw errors;
            }
        }

        // special case for arrays
        if ((field as Field).arrayType && val) {

            val = new Proxy(val, GetArrayProxyHandler(this, key));

        }

        dirty[key] = true;
        data[key] = val;
    };

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
                if (['push', 'unshift', 'pop', 'shift', 'splice'].indexOf(prop as string) > -1) {
                    return function () {
                        dirty[key] = true;
                        return (Array.prototype as any)[func_name].apply(target, arguments);
                    }
                }
                /* if (['pop', 'shift', 'splice'].indexOf(prop as string) > -1) {
                     return function () {
                         dirty[key] = true;
                         const el = (Array.prototype as any)[func_name].apply(target, arguments);
                         return el;
                     }
                 }*/

                return val.bind(target);
            }

            return val;
        },

        set(target, prop, val, receiver) {

            target[prop] = val;
            dirty[key] = true;

            return true;
        }
    };
}


function ExecuteValidators(model: any, key: string, newValue: any, validators: Function[]): Error[] {

    let errors: Error[] = [];

    for (let i = 0; i < validators.length; ++i) {

        try {
            validators[i](model, key, newValue);
        }
        catch (err) {
            errors.push(err);
        }


    }

    return errors;

}


function GetModelSerializeFunction<T>(type: Type<T>, annotations: any): any {


    const fields: Field[] = [];
    for (let name in annotations) {
        fields.push(
            ExtractMetaFromArray(annotations[name], Field) || 
            ExtractMetaFromArray(annotations[name], ID));
    }

    return function (val: any): any {

        //if(!val) return val;

        let result: any = {};

        for (let i = 0; i < fields.length; ++i) {

            let field: Field = fields[i];
            let v = val[field.key];

            if(v) {
                v = TypeManager.Serialize(field.arrayType || field.type, v);
            }
            
            result[field.key] = v;
        }

        return result;
    };
}

function GetModelDeserializeFunction<T>(type: Type<T>, annotations: any): any {

    const fields: Field[] = [];
    for (let name in annotations) {
        fields.push(
            ExtractMetaFromArray(annotations[name], Field) || 
            ExtractMetaFromArray(annotations[name], ID));
    }

    return function (val: any): any {

        let result = new (type as any)();

        for (let i = 0; i < fields.length; ++i) {

            let field: Field = fields[i];
            let v = val[field.key];

            if (v === undefined) {
                continue;
            }

            v = TypeManager.Deserialize(field.arrayType || field.type, v);

            result[field.key] = v;
        }

        ClearModelDirtyFields(result);

        return result;

    };
}

function ExtractMetaFromArray(arr: any[], type: any) {

    for (let i = 0; i < arr.length; ++i) {

        if (arr[i] instanceof type) {
            return arr[i];
        }
    }

    return null;
}


function GetOrDefineInWeakMap(map: WeakMap<object, any>, key: object) {

    let data = map.get(key);
    if (!data) {
        data = {}
        map.set(key, data);
    }

    return data;
}