




export function GetOrSet(target: any, key: string, defaultValue: any = {}) {
    
    if (target[key] === undefined) {
        Object.defineProperty(target, key, {
            value: defaultValue,
            enumerable: false,
            configurable: false,
            writable: false
        });
    }

    return target[key];
}

