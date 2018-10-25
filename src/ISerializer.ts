
import { Type } from '@uon/core';

export interface ISerializer {

    serialize<T, O>(model: T | T[]): O | O[];
    deserialize<T, I>(type: Type<T>, input: I | I[]): T | T[];

}