

export interface JsonSerializerOptions {
    replacer?: (key: string, value: any) => any;
    space?: string | number;

}

export class JsonSerializer {

    constructor(private _options: JsonSerializerOptions = {}) {

    }




}