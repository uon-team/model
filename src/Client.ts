import { Db, MongoClient, Server } from 'mongodb';
import { parse as ParseUrl, Url } from 'url';

import { Collection, PersistentModel } from './Collection';
import { META_MODEL, HasMetadataInstance } from './Metadata';
import { Model, GetModelFieldList, ClearDirtyFlags } from './Model';
import { Field } from './Field';
import { Type } from './Type';
import { TypeManager } from './TypeManager';
import { ObjectId } from 'bson';

export interface FindQueryOptions {
    offset?: number;
    limit?: number;
    sort?: string[];
    fields?: string[];
    populate?: boolean | string[];
}

const DEFAULT_FIND_OPTIONS: FindQueryOptions = {
    populate: true
};


/**
 * The interface for making querie
 */
export class Client {
    private _client: MongoClient;
    private _db: Db;
    private _url: Url;
    private _connected: boolean;


    constructor() { }

	/**
	 * Connect to a mongo server
	 * @param url
	 */
    connect(url: string) {
        this._url = ParseUrl(url);

        return MongoClient.connect(url).then((client) => {

            this._client = client;
            this._db = client.db(this._url.path.replace('/', ''));
            this._connected = true;
        });
    }

	/**
	 * Close the mongodb connection
	 */
    close() {
        if (!this._db) {
            throw new Error('db/Client: Trying to close an non-existing connection');
        }

        return this._client.close().then(() => {
            this._connected = false;
        });
    }

    /**
     * Make sure indices are created and or removed to match the collection's index definition
     * @param type 
     */
    syncIndices<T>(type: Type<T>): Promise<void> {

        let meta = GetCollectionMetadata(type);

        
        return Promise.resolve();
    }


    /**
     * Find multiple entries
     * @param type 
     * @param query 
     * @param options 
     */
    find<T>(type: Type<T>, query: any, options: FindQueryOptions = DEFAULT_FIND_OPTIONS): Promise<T[]> {

        let meta = GetCollectionMetadata(type);

        // make sure that we have collection metadata
        if (!meta.collection) {
            throw new Error('Model with type ' + type.name + ' is not a collection');
        }

        // grab the collection
        let collection = this._db.collection(meta.collection.name);

        // get a cursor
        let cursor = collection.find(query);

        // specify collation
        //cursor = cursor.collation({ locale: 'en', strength: 1 });

        // handle sort
        if (options.sort) {

            let sort_options: any = {};

            // add in text score sorting for text search
            if (query.$text) {
                sort_options.textScore = {
                    $meta: "textScore"
                };
            }

            for (let i = 0; i < options.sort.length; ++i) {
                let s = options.sort[i];
                var sort_order = 1;
                if (s.charAt(0) === '-') {
                    sort_order = -1;
                    s = s.substring(1);
                }
                sort_options[s] = sort_order;
            }

            cursor = cursor.sort(sort_options);
        }


        // handle offset
        if (options.offset !== undefined) {
            cursor = cursor.skip(options.offset);
        }

        // handle limit
        if (options.limit !== undefined) {
            cursor = cursor.limit(options.limit);
        }

        // handle fields
        if (Array.isArray(options.fields)) {

            let fields: any = { _id: 1 };

            for (let i = 0; i < options.fields.length; ++i) {
                fields[options.fields[i]] = 1;
            }

            if (query.$text) {
                fields.textScore = {
                    $meta: "textScore"
                };
            }
            cursor = cursor.project(fields);
        }

        // do it
        return cursor.toArray().then((result) => {

            let res: T[] = TypeManager.Deserialize(type, result) as T[];
            
            if(options.populate) {
                return this.populate(res, options.populate === true ? undefined : options.populate)
            }

            return res;

        });
    }

    /**
     * Find a single entry matching the query
     * @param type 
     * @param query 
     * @param populate 
     */
    findOne<T>(type: Type<T>, query: any, populate: boolean | string[] = true) {

        let meta = GetCollectionMetadata(type);

        // make sure that we have collection metadata
        if (!meta.collection) {
            throw new Error('Model with type ' + type.name + ' is not a collection');
        }

        // grab the collection
        let collection = this._db.collection(meta.collection.name);

        return collection.findOne(query).then((result) => {

            let model = TypeManager.Deserialize(type, result);

            if (populate) {
                return this.populate([model], populate === true ? undefined : populate).then(() => {

                    return model;
                });
            }

            return model;
        });

    }

    /**
     * Perform a count operation on a collection
     * @param type 
     * @param query 
     */
    count<T>(type: Type<T>, query: any) {

        let meta = GetCollectionMetadata(type);

        // make sure that we have collection metadata
        if (!meta.collection) {
            throw new Error('Model with type ' + type.name + ' is not a collection');
        }

        // grab the collection
        let collection = this._db.collection(meta.collection.name);

        // do it
        return collection.count(query);
    }

	/**
	 * Update an instance of a persistent model
	 * @param model
	 */
    update<T extends PersistentModel>(model: T, extraOps?: any) {

        let ctor = (model as any).constructor;
        let meta = GetCollectionMetadata(ctor);

        // make sure that we have collection metadata
        if (!meta.collection) {
            throw new Error('Model with type ' + ctor.name + ' is not a collection');
        }

        // grab the collection
        let collection = this._db.collection(meta.collection.name);

        // prepare the update operation
        let op: any = PrepareUpdateOp(model, meta);

        // prepare the query based on the primary field
        let query: any = {};
        query[meta.collection.primaryKey] = (model as any)[meta.collection.primaryKey];



        // do it
        return collection.updateOne(query, op, { upsert: true })
            .then((result) => {

                // grab the upserted id just in case we havent provided one
                model._id = result.upsertedId._id;

                // reset dirty fields
                ClearDirtyFlags(model);

                return model;
            });
    }

    insertMany<T extends PersistentModel>(type: Type<T>, values: T[]) : Promise<any> {



        return null;
    }

    /**
     * Delete an instance from the db
     * @param model 
     */
    deleteOne<T extends PersistentModel>(model: T) {

        let ctor = (model as any).constructor;
        let meta = GetCollectionMetadata(ctor);

        // make sure that we have collection metadata
        if (!meta.collection) {
            throw new Error('Model with type ' + ctor.name + ' is not a collection');
        }

        // grab the collection
        let collection = this._db.collection(meta.collection.name);

        // do it
        return collection.deleteOne({ _id: model._id }).then((result) => {
            return result.result.n == 1;
        });

    }

    /**
     * Delete all entries that matches the query
     * @param type 
     * @param query 
     */
    deleteMany<T>(type: Type<T>, query: any) {

        let meta = GetCollectionMetadata(type);

        // make sure that we have collection metadata
        if (!meta.collection) {
            throw new Error('Model with type ' + type.name + ' is not a collection');
        }


    }

    /**
     * Populate all DbRefs from the models
     * @param models 
     * @param fields 
     */
    populate<T>(models: T[], fields?: string[]) {


        if (models.length == 0) {
            return Promise.resolve(models);
        }

        let ref_list_by_type = new Map<Type<any>, string[]>();
        let has_field_list = Array.isArray(fields);

        let meta = GetCollectionMetadata(models[0].constructor as any);
        let fields_meta = GetModelFieldList(meta.model);

        // go over all the models provided
        for (let i = 0, l = models.length; i < l; ++i) {

            let model = models[i] as any;
            // go over all fields
            for (let j = 0; j < fields_meta.length; ++j) {
                let f = fields_meta[i];

                // skip non relevant fields 
                if ((has_field_list && fields.indexOf(f.key) < 0) || !f.isDBRef || !model[f.key]) {
                    continue;
                }

                let field_type = f.arrayType || f.type;

                // get the id list for this type
                let id_list: string[] = ref_list_by_type.get(field_type);

                // lazy init of type map
                if (!id_list) {
                    id_list = [];
                    ref_list_by_type.set(field_type, id_list);
                }

                // if we got an array of references
                if (f.arrayType) {

                    model[f.key].forEach((ref: any) => {
                        let canonical_id = ref._id.toString();
                        if (id_list.indexOf(canonical_id) === -1) {
                            id_list.push(canonical_id);
                        }
                    });

                }
                // or just a single ref
                else {

                    let canonical_id = model[f.key]._id.toString();
                    if (id_list.indexOf(canonical_id) === -1) {
                        id_list.push(canonical_id);
                    }

                }

            }

        }


        // much promise
        var promises: Promise<any>[] = [];
        var value_map = new Map();

        // go over all ref lists by type
        for (let [type, idList] of ref_list_by_type) {

            let map_by_id: any = {};
            value_map.set(type, map_by_id);

            // cast the ids to ObjectIds
            let casted_id_list: ObjectId[] = idList.map(id => new ObjectId(id));

            // find all objects
            let p = this.find(type, { '_id': { $in: casted_id_list } }, { populate: false })
                .then((results) => {
                    results.forEach((r) => {
                        map_by_id[r._id.toString()] = r;
                    });

                });

            promises.push(p);

        }

        // wait for a fetches to complete
        return Promise.all(promises).then(() => {

            // finally assign the proper object where they belong
            for (let i = 0, l = models.length; i < l; ++i) {

                let model = models[i] as any;

                // go over all referenced keys
                for (let j = 0; j < fields_meta.length; ++j) {

                    let f = fields_meta[j];

                    if (!f.isDBRef || !model[f.key]) {
                        continue;
                    }

                    let field_type = f.arrayType || f.type;

                    // get the id list for this type
                    let values = value_map.get(field_type);

                    // get the placeholder object
                    let old_value = model[f.key];

                    // ignore the rest if value undefined
                    if (!old_value) {
                        continue;
                    }

                    // if we got an array of references
                    if (f.arrayType) {

                        // we want to replace elements in place to not mess up the ordering
                        old_value.forEach((v: any, index: number) => {

                            let canonical_id = v._id.toString();

                            old_value[index] = values[canonical_id];

                        });

                    }
                    // or just a single ref
                    else {

                        let canonical_id = old_value._id.toString();

                        // assign new value if it is defined
                        if (values[canonical_id] !== undefined) {
                            model._data[f.key] = values[canonical_id];
                        }


                    }

                }

            }


            return models;

        }).catch((err) => {

            console.trace(err);
            throw err;
        });

    }


    
}


/**
 * Aggregation of model and collection metadata
 */
interface ModelMetadata {
    model: Model;
    collection: Collection;
}

/**
 * Fetch the model and collection metadata for a type
 * @private 
 * @param type 
 */
function GetCollectionMetadata<T>(type: Type<T>): ModelMetadata {
    let annotations: any[] = Reflect.getMetadata(META_MODEL, type);

    let model: Model = null;
    let collection: Collection = null;
    for (let i = 0; i < annotations.length; ++i) {
        if (annotations[i] instanceof Collection) {
            collection = annotations[i];
        } else if (annotations[i] instanceof Model) {
            model = annotations[i];
        }
    }

    return { model, collection };
}

/**
 * Create a mongo update operation
 * @param model 
 * @param meta 
 * @param out 
 * @param keyPrefix 
 */
function PrepareUpdateOp<T extends PersistentModel>(
    model: T, meta: ModelMetadata, out?: any, keyPrefix?: string) {


    out = out || {
    };

    keyPrefix = keyPrefix ? keyPrefix + '.' : '';

    let fields_meta = meta.model.fields;
    let fields: Field[] = [];



    // get the field metadata instances and put in into a flat list
    for (let key in fields_meta) {
        let list = fields_meta[key];
        for (let i = 0; i < list.length; ++i) {
            if (list[i] instanceof Field) {
                fields.push(list[i]);
            }
        }
    }

    let m = (model as any);
    let dirty = m['__dirty__'];

    let set_op: any = out.$set;
    let unset_op: any = out.$unset;

    for (let i = 0; i < fields.length; ++i) {
        let f = fields[i];
        let prefixed_key = keyPrefix + f.key;

        // check if the field is dirty
        let is_dirty = dirty[f.key] != undefined;

        // check if the field is a model
        let is_model = HasMetadataInstance(META_MODEL, f.type, Model);

        if (is_model && !f.isDBRef && !is_dirty) {
            let model_meta = GetCollectionMetadata(f.type);
            PrepareUpdateOp(m[f.key], model_meta, out, prefixed_key);
        }

        if (is_dirty) {
            let value = m[f.key];

            if (value === undefined) {
                // do unset
                if (!out.$unset) out.$unset = {};
                out.$unset[prefixed_key] = "";
            }
            else {
                if (!out.$set) out.$set = {};
                out.$set[prefixed_key] = TypeManager.Serialize(f.arrayType || f.type, value);
            }
        }

    }

    return out;
}
