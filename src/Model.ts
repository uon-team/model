
import { GetOrDefineMetadata, CreateMetadataCtor, META_FIELDS, META_MODEL } from './Metadata'
import { Type } from './Type';
import { Field } from './Field';
import { Index } from './Index';
import { Validate } from './Validate';
import { TypeManager } from './TypeManager';

export interface Model {
    fields: { [k: string]: any[] }
}

export function Model(...args: any[]) {

    const meta_ctor = CreateMetadataCtor((fields: any) => ({ fields }));
    if (this instanceof Model) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function ModelDecorator(target: any) {

        // get the fields meta object
        let annotations: any[] = GetOrDefineMetadata(META_MODEL, target, []);

        // get all defined field
        let fields: any = GetOrDefineMetadata(META_FIELDS, target.prototype, {});

        // create a new instance of the field metadata
        let model_instance = new (Model as any)(fields);
        annotations.push(model_instance);


        // replace member with getter setter
        for (let name in fields) {
            ReplacePropertyWithGetterSetter(target.prototype, name, fields[name]);
        }


        // define dirty fields map
        Object.defineProperty(target.prototype, '_dirty', {
            get: function () {
                this.__dirty__ = this.__dirty__ || {};
                return this.__dirty__;
            },
            enumerable: false
        });

        // also define storage for data for each instance
        Object.defineProperty(target.prototype, '_data', {
            get: function () {
                this.__data__ = this.__data__ || {};
                return this.__data__;
            },
            enumerable: false
        });


        // define toJson method
        /*if(!target.prototype.toJSON) {
            target.prototype.toJSON = function () {

                let result: any = {};
    
                for (let name in fields) {
                    result[name] = this[name];
                }
    
                return JSON.stringify(result);
            }
        }*/


        // build a serialization function for this model
        const serialize = GetModelSerializeFunction(target, fields);

        // build a deserialization function for this model
        const deserialize = GetModelDeserializeFunction(target, fields);

        // Register type with type manager
        TypeManager.Register(target, { serialize, deserialize });


        return target;
    }
}

/**
 * Get a list of Field metadata from the Model metadata
 * @param m 
 */
export function GetModelFieldList(m: Model) {

    let result: Field[] = []
    for(let key in m.fields) {
        result.push(ExtractFieldMetaFromArray(m.fields[key]));
    }

    return result;
}

/**
 * Reset the dirty fields on an object
 * @param m 
 */
export function ClearDirtyFlags<T>(m: T) {
    (m as any).__dirty__ = {};
}


function ReplacePropertyWithGetterSetter(target: any, key: string, annotations: any[]) {

    let field: Field;
    let validators: Validate;

    for (let i = 0; i < annotations.length; i++) {
        let a = annotations[i];
        if (a instanceof Validate) {
            validators = a;
        }
        else if(a instanceof Field) {
            field = a;
        }
    }


    // property getter
    const getter = function () {
        return this._data[key];
    };

    // property setter
    const setter = function (newVal: any) {

        let old_val = this._data[key];
        let val: any = newVal;

        // execute validators
        if(validators) {
            let errors = ExecuteValidators(this, key, val, validators.validators);
            if (errors.length) {
                throw errors;
            }
        }

        // special case for arrays
        if(field.arrayType && val) {
           
            val = new Proxy(val, GetArrayProxyHandler(this, key));

        }

        this._dirty[key] = true;
        this._data[key] = val;
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

function GetArrayProxyHandler(inst: any, key: string): ProxyHandler<any> {

    return {
        get(target, prop) {
            const val = target[prop];
            const func_name = prop as string;
            if (typeof val === 'function') {
                if (['push', 'unshift'].indexOf(prop as string) > -1) {
                    return function (el: number) {
                        inst._dirty[key] = true;
                        return (Array.prototype as any)[func_name].apply(target, arguments);
                    }
                }
                if (['pop', 'shift', 'splice'].indexOf(prop as string) > -1) {
                    return function () {
                        inst._dirty[key] = true;
                        const el = (Array.prototype as any)[func_name].apply(target, arguments);
                        return el;
                    }
                }
                return val.bind(target);
            }

            return val;
        },

        set(target, prop, val, receiver) {

            target[prop] = val;
            inst._dirty[key] = true;
           
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


function GetModelSerializeFunction<T>(type: Type<T>, fields: any): any {



    return function (val: any): any {

        let result: any = {};

        for (let name in fields) {
            let v = val[name];

            let field: Field = ExtractFieldMetaFromArray(fields[name]);

            if (field.isDBRef) {

                // TODO change this to be primary field, or use Mongo's DbRef?
                v = v['_id'];
            }

            v = TypeManager.Serialize(field.arrayType || field.type, v);

            result[name] = v;
        }

        return result;
    };
}

function GetModelDeserializeFunction<T>(type: Type<any>, fields: any): any {

    return function (val: any): any {

        let result = new (type as any)();

        for (let name in fields) {
            let v = val[name];

            if (v === undefined) {
                continue;
            }

            let field: Field = ExtractFieldMetaFromArray(fields[name]);
     
            if (field.isDBRef) {
                // TODO change this to be primary field, or use Mongo's DbRef?
                v = { _id : v };
            }

            v = TypeManager.Deserialize(field.arrayType || field.type, v);
 
            result[name] = v;
        }

        // reset dirty fields
        ClearDirtyFlags(result);

        return result;

    };
}

function ExtractFieldMetaFromArray(arr: any[]) {

    for (let i = 0; i < arr.length; ++i) {

        if (arr[i] instanceof Field) {
            return arr[i];
        }
    }
}