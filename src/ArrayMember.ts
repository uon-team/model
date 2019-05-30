import { Type, MakeUnique, MakePropertyDecorator, GetMetadata } from "@uon/core";
import { Member } from "./Member";
import { NumberType, TypedNumber } from "./NumberMember";
import { ARRAY_MEMBER_DECORATOR_NAME } from "./Common";

/**
 * ArrayMemberDecorator interface makes tsc happy
 */
export interface ArrayMemberDecorator {
    (elementType: Type<any> | TypedNumber): PropertyDecorator;
    new(elementType: Type<any> | TypedNumber): ArrayMember;
}

/**
 * The metadata for a model's array member
 */
export interface ArrayMember {
    key: string;
    type?: Type<any> | TypedNumber;
}

export const ArrayMember: ArrayMemberDecorator = MakeUnique(ARRAY_MEMBER_DECORATOR_NAME,
    MakePropertyDecorator(ARRAY_MEMBER_DECORATOR_NAME,
        (elementType: Type<any> | TypedNumber) => ({ type: elementType }),
        Member,
        (target: any, meta: ArrayMember, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key);

            // can only use ArrayMember decorator on array members
            if (type && type != Array) {
                throw new Error("You can only use ArrayMember on array members.");
            }

            meta.key = key;

        }));
