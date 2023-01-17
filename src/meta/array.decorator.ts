import { Type, MakeUnique, MakePropertyDecorator, GetMetadata, GetTypeMetadata } from "@uon/core";
import { Member, MemberOptions, ID } from "./member.decorator";
import { Validator } from "../base/validator";
import { TypedNumber } from "../base/number.type";
import { ARRAY_MEMBER_DECORATOR_NAME, MODEL_DECORATOR_NAME } from "../base/constants";

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
    /**
     * if the member is a model, this field will be populated
     */
    model?: { id: ID };
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
            let type: Type<any> = GetMetadata('design:type', target, key) as Type<any>;

            // can only use ArrayMember decorator on array members
            if (type && type != Array) {
                throw new Error("You can only use ArrayMember on members of type Array.");
            }

            let annotations = GetTypeMetadata(meta.type as Type<any>);

            meta.key = key;
            meta.model = annotations.find(a => a.decoratorName === MODEL_DECORATOR_NAME);
            
        }));
