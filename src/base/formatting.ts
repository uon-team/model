import { PropertyNamesNotOfType, Type } from "@uon/core";
import { Model } from "../meta/model.decorator";
import { FindModelAnnotation, GetMemberForKey, GetModelMembers } from "../utils/model.utils";
import { Formatter } from "./formatter";




export function FormatModel<T>(target: T) {

    const type = target.constructor as Type<T>;
    const model = type ? FindModelAnnotation(type) as Model : null;

    const all_formaters: { [K in keyof T]: Formatter[] } = model ? Object.assign({}, model.formatters as any) : {};

    const members = GetModelMembers(model);

    for (let member of members) {

        const key = member.key as keyof T;

        if (!target[key]) {
            continue;
        }

        if (member.model) {
            FormatModel(target[key]);
        }
        else if (all_formaters[key]) {

            for (let f of all_formaters[key]) {
                target[key] = f(target, key as string, target[key]);
            }
        }


    }


}