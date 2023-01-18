
import { GetTypeMetadata, PropertyNamesNotOfType, Type } from "@uon/core"
import { Member } from "../meta/member.decorator"
import { Model } from "../meta/model.decorator"
import { MODEL_DECORATOR_NAME } from "../base/constants"


/*
 * Given a type, find a @Model annotation
 * @param annotations 
 */
export function FindModelAnnotation<T>(type: Type<T>): any {

    const annotations = GetTypeMetadata(type);
    for (let i = 0, l = annotations.length; i < l; ++i) {
        if (annotations[i].decoratorName === MODEL_DECORATOR_NAME) {
            return annotations[i];
        }
    }

    return null;
}


/**
 * Get all @Member property annotations for a given Model metadata
 * @param model 
 */
export function GetModelMembers(model: Model): Member[] {

    const annotations = model.properties;
    const members_meta: Member[] = [];
    for (let name in annotations) {
        let member = ExtractMetaFromArray(annotations[name], Member);
        if (member) {
            members_meta.push(member);
        }
    }

    return members_meta;

}

export function GetModelMembersMap(model: Model): { [k: string]: Member } {

    const annotations = model.properties;
    const result: { [k: string]: Member } = {};
    for (let name in annotations) {
        let member = ExtractMetaFromArray(annotations[name], Member);
        if (member) {
            result[name] = member;
        }
    }

    return result;

}


export function GetMemberForKey(model: Model, key: string): Member | null {
    const annotations = model.properties;

    if (annotations[key]) {
        return ExtractMetaFromArray(annotations[key], Member);
    }

    return null;
}


/**
 * 
 * @param arr 
 * @param type 
 * @private
 */
function ExtractMetaFromArray(arr: any[], type: any) {

    for (let i = 0; i < arr.length; ++i) {

        if (arr[i] instanceof type) {
            return arr[i];
        }
    }

    return null;
}