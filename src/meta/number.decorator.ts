
import {
    Type,
    GetMetadata,
    MakePropertyDecorator,
    MakeUnique
} from '@uon/core'
import { Member } from './member.decorator';
import { NUMBER_MEMBER_DECORATOR_NAME } from '../base/constants';
import { NumberType } from '../base/number.type';





export interface NumberMemberDecorator {
    (type: NumberType): PropertyDecorator;
    new(type: NumberType): NumberType
}

/**
 * The metadata for a model's serializable field
 */
export interface NumberMember {
    key: string;
    type: NumberType;
}

export const NumberMember: NumberMemberDecorator = MakeUnique(NUMBER_MEMBER_DECORATOR_NAME,
    MakePropertyDecorator(NUMBER_MEMBER_DECORATOR_NAME,
        (type: NumberType) => ({ type }),
        Member,
        (target: any, meta: NumberMember, key: string) => {

            // get the field type 
            let type: Type<any> = GetMetadata('design:type', target, key);

            if (type && type != Number) {
                throw new Error(`NumberType decorator can only be declared on property with type Number`);
            }

            meta.key = key;

        }));
