import { MakeUnique, Include, PropertyNamesNotOfType } from "@uon/core";
import { GetOrSet } from "../utils/getset";
import { MUT_SYMBOL } from "./constants";

export interface ArrayMutation {
    op: 'push' | 'pop' | 'splice' | 'shift' | 'unshift' | 'set';
    args?: any[];
}

export type Mutations<T, U = Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>> = {
    [K in keyof U]:
    boolean
    | Include<U[K], any[], ArrayMutation[]>
}

export function ClearMutations<T>(obj: T, fields?: string[]) {

    const dirty = GetOrSet(obj as any, MUT_SYMBOL);
    let keys = fields || Object.keys(dirty);
    keys.forEach((k) => {
        delete dirty[k];
    });
}

export function GetMutations<T>(obj: T) {
    return GetOrSet(obj as any, MUT_SYMBOL) as Mutations<T>;
}

export function MakeDirty<T>(obj: T, key: keyof T) {
    const dirty = GetOrSet(obj as any, MUT_SYMBOL);
    dirty[key] = true;
}




