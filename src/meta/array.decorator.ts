import { Type, MakeUnique, MakePropertyDecorator, GetMetadata } from "@uon/core";
import { Member, MemberOptions } from "./member.decorator";
import { Validator } from "../base/validation";
import { TypedNumber } from "../base/number.type";
import { ARRAY_MEMBER_DECORATOR_NAME } from "../base/constants";

/**
 * ArrayMemberDecorator interface makes tsc happy
 */
export interface ArrayMemberDecorator {
    (elementType: Type<any> | TypedNumber, options?: ArrayMemberOptions): PropertyDecorator;
    new(elementType: Type<any> | TypedNumber, options?: ArrayMemberOptions): ArrayMember;
}

/**
 * The metadata for a model's array member
 */
export interface ArrayMember {
    key: string;
    type?: Type<any> | TypedNumber;
}


export interface ArrayMemberOptions extends MemberOptions {

    /**
     * If the value set is not an array
     */
    elementValidators?: Validator[];


}

export const ArrayMember: ArrayMemberDecorator = MakeUnique(ARRAY_MEMBER_DECORATOR_NAME,
    MakePropertyDecorator(ARRAY_MEMBER_DECORATOR_NAME,
        (elementType: Type<any> | TypedNumber, options?: ArrayMemberOptions) => ({ type: elementType, ...options }),
        Member,
        (target: any, meta: ArrayMember, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key);

            // can only use ArrayMember decorator on array members
            if (type && type != Array) {
                throw new Error("You can only use ArrayMember on members of type Array.");
            }

            meta.key = key;

        }));
