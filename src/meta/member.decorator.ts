
import {
    Type,
    GetMetadata,
    MakePropertyDecorator,
    MakeUnique,
    GetTypeMetadata
} from '@uon/core'
import { Validator } from '../base/validation';
import { MEMBER_DECORATOR_NAME, MODEL_DECORATOR_NAME, ID_DECORATOR_NAME } from '../base/constants';

/**
 * MemberDecorator interface makes tsc happy
 */
export interface MemberDecorator {
    (options?: MemberOptions): PropertyDecorator;
    new(options: MemberOptions): Member;
}

/**
 * The metadata for a model's serializable field
 */
export interface Member extends MemberOptions {

    /**
     * The field key
     */
    key: string;

    /**
     * The field value type
     */
    type?: Type<any>;


    /**
     * if the member is a model, this field will be populated
     */
    model?: { id: ID };

}

export interface MemberOptions {

    /**
     * An array of validator to call when Validate() is invoked 
     */
    validators?: Validator[];


    /**
     * Coerse the incoming value to the target type during deserialization
     * @param v 
     */
    coerse?(v: any): any;


}

export const Member: MemberDecorator = MakeUnique(MEMBER_DECORATOR_NAME,
    MakePropertyDecorator(MEMBER_DECORATOR_NAME,
        (options?: MemberOptions) => options,
        null,
        (target: any, meta: Member, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key) as Type<any>;
            let annotations = GetTypeMetadata(type);

            // ArrayMember must be used for arrays
            if (type == Array) {
                throw new Error("You must use ArrayMember decorator for array members");
            }

            meta.key = key;
            meta.type = meta.type || type;
            meta.model = annotations.find(a => a.decoratorName === MODEL_DECORATOR_NAME);

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


export const ID: IDDecorator = MakeUnique(ID_DECORATOR_NAME,
    MakePropertyDecorator(ID_DECORATOR_NAME,
        (key: string, type: Type<any>) => ({ key, type }),
        Member,
        (target, meta: ID, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key) as Type<any>;

            meta.key = key;
            meta.type = type;

        }));

