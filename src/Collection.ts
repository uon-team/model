
import { GetOrDefineMetadata, CreateMetadataCtor, META_FIELDS, META_MODEL } from './Metadata'
import { Field } from './Field';
import { Index } from './Index';
import { ObjectId } from 'bson';


export interface PersistentModel {
    _id: ObjectId;
}
/**
 * Defines a persistent collection
 */
export interface Collection {

    // name of the collection, if not provided, with use lowercase class name with + 's'
    name?: string;

    // the name of the primary (unique) key field for update operations, defaults to "_id"
    primaryKey?: string;

    // the list of indices to create on the collection
    indices?: Index[];

    

}

export function Collection(meta: Collection = {}) {

    const meta_ctor = CreateMetadataCtor((meta: Collection) => meta);
    if (this instanceof Collection) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function CollectionDecorator(target: any) {

        // get the fields meta object
        let annotations: any[] = GetOrDefineMetadata(META_MODEL, target, []);

        // set collection name if not set
        meta.name = meta.name || target.name.toLowerCase() + 's';
        meta.primaryKey = meta.primaryKey || "_id";

        // create a new instance of the field metadata
        let col_instance = new (Collection as any)(meta);
        annotations.push(col_instance);


        return target;
    }
}
