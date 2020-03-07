import { GLOBAL } from "@uon/core";




declare function atob(str: string): string;
declare function btoa(str: string): string;
declare var Buffer: any;


export function Utf8ToBase64(str: string): string {
    if (GLOBAL.atob) {
        return atob(str);
    }
    else {
        return Buffer.from(str, 'utf8').toString('base64');
    }
}


export function Base64ToUtf8(str: string): string {
    if (GLOBAL.atob) {
        return btoa(str);
    }
    else {
        return Buffer.from(str, 'base64').toString('utf8');
    }
}