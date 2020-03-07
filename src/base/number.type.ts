import { MakeUnique } from "@uon/core";


export class TypedNumber {
    // duck typing madness
    __TypedNumber = true;
    constructor(readonly name: string, readonly size: number) {}
}

export interface Int8 { }
export interface Int16 { }
export interface Int32 { }
export interface Int64 { }
export interface Uint8 { }
export interface Uint16 { }
export interface Uint32 { }
export interface Uint64 { }
export interface Float32 { }
export interface Float64 { }

export const Int8 =     MakeUnique(`@uon/model/Int8`, new TypedNumber('Int8',1));
export const Int16 =    MakeUnique(`@uon/model/Int16`, new TypedNumber('Int16', 2));
export const Int32 =    MakeUnique(`@uon/model/Int32`, new TypedNumber('Int32', 4));
export const Int64 =    MakeUnique(`@uon/model/Int64`, new TypedNumber('Int64', 8));
export const Uint8 =    MakeUnique(`@uon/model/Uint8`, new TypedNumber('Uint8', 1));
export const Uint16 =   MakeUnique(`@uon/model/Uint16`, new TypedNumber('Uint16', 2));
export const Uint32 =   MakeUnique(`@uon/model/Uint32`, new TypedNumber('Uint32', 4));
export const Uint64 =   MakeUnique(`@uon/model/Uint64`, new TypedNumber('Uint64', 8));
export const Float32 =  MakeUnique(`@uon/model/Float32`, new TypedNumber('Float32', 4));
export const Float64 =  MakeUnique(`@uon/model/Float64`, new TypedNumber('Float64', 8));

export type NumberType = Int8 | Int16 | Int32 | Int64 | Uint8 | Uint16 | Uint32 | Uint64 | Float32 | Float64;