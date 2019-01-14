
import {
    Type,
    GetMetadata,
    MakePropertyDecorator,
    MakeUnique
} from '@uon/core'
import { Validator } from './Validate';


/**
 * MemberDecorator interface makes tsc happy
 */
export interface MemberDecorator {
    (validators?: Validator[]): PropertyDecorator;
    new(validators: Validator[]): Member;
}

/**
 * The metadata for a model's serializable field
 */
export interface Member {
    key: string;
    type?: Type<any>;
    validators?: Validator[];
}

export const Member: MemberDecorator = MakeUnique(`@uon/model/Member`,
    MakePropertyDecorator("Member",
        (validators?: Validator[]) => ({ validators }),
        null,
        (target: any, meta: Member, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key);

            // ArrayMember must be used for arrays
            if (type == Array) {
                throw new Error("You must use ArrayMember decorator for array members");
            }

            meta.key = key;
            meta.type = type;

        }));





export interface IDDecorator {
    (): PropertyDecorator;
    new(key: string, type: Type<any>): ID
}

/**
 * Represents the primary key of a model
 */
export interface ID extends Member {
    key: string;
    type: Type<any>;
}


export const ID: IDDecorator = MakeUnique(`@uon/model/ID`,
    MakePropertyDecorator("ID",
        (key: string, type: Type<any>) => ({ key, type }),
        Member,
        (target, meta: ID, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key);

            meta.key = key;
            meta.type = type;

        }));

