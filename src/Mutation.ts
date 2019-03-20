

export type Unpack<T> = T extends (infer U)[] ? U : T;
export type Include<M, T, U> = M extends T ? U : never;

export type PropertyNamesOfType<T, P> = { [K in keyof T]: T[K] extends P ? K : never }[keyof T];
export type PropertyNamesNotOfType<T, P> = { [K in keyof T]: T[K] extends P ? never : K }[keyof T];

export interface ArrayMutation {
    op: 'push' | 'pop' | 'splice' | 'shift' | 'unshift' | 'set';
    args?: any[];
}

export type Mutations<T, U = Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>> =  {
    [K in keyof U]:
    boolean
    | Include<U[K], any[], ArrayMutation[]>
}