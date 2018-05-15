

import { GetOrDefineMetadata, CreateMetadataCtor, META_FIELDS } from './Metadata'


export type IndexFields = {[k: string] : 1 | -1 | 'text' | '2dsphere' | 'geoHaystack' };

export interface IndexCollation {
    locale?: string;
    strength?: number;
}

export interface Index {

    // name of the index
    name: string;

    // a map of fields and their index type
    fields: IndexFields,

    // if the indexed value should be unique
    unique?: boolean;

    // force a sparse index
    sparse?: boolean;

    // the index collation
    collation?: IndexCollation;

    // define a time to live in seconds
    ttl?: number;

    // default language to use for text indices
    defaultLanguage?: string;
    
    // override for the default field name for language
    languageFieldName?: string;

}


export function CompareIndex(a: Index, b: Index): boolean {


    return false;
}