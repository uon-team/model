import { MakeUnique, Include, PropertyNamesNotOfType } from "@uon/core";


export interface ArrayMutation {
    op: 'push' | 'pop' | 'splice' | 'shift' | 'unshift' | 'set';
    args?: any[];
}

export type Mutations<T, U = Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>> = {
    [K in keyof U]:
    boolean
    | Include<U[K], any[], ArrayMutation[]>
}

// a weak map to keep dirty fields for models
export const MUTATIONS_WEAPMAP = MakeUnique('@uon/model/mutation/map', new WeakMap<object, { [k: string]: boolean }>());


export function ClearMutations<T>(obj: T) {

    const dirty = GetOrDefineInWeakMap(MUTATIONS_WEAPMAP, obj as any);
    let keys = Object.keys(dirty);
    keys.forEach((k) => {
        delete dirty[k];
    });
}


/**
 * 
 * @param map 
 * @param key 
 */
export function GetOrDefineInWeakMap(map: WeakMap<object, any>, key: object) {

    let data = map.get(key);
    if (!data) {
        data = {}
        map.set(key, data);
    }

    return data;
}
