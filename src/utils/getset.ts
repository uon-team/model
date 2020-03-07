export function GetOrSet(target: any, key: string, defaultValue: any = {}) {
    if (target[key] !== undefined) {
        return target[key];
    }

    return target[key] = defaultValue;
}

