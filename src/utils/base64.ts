declare function atob(str: string): string;
declare function btoa(str: string): string;
declare var Buffer: any;


/**
 * Encode a string to a base64 string.
 *
 * Prefers node's Buffer (which handles UTF-8 correctly); falls back to the
 * browser's btoa(). NOTE: the btoa() fallback only supports latin1 input.
 * @param str the string to encode
 * @returns the base64 representation
 */
export function Utf8ToBase64(str: string): string {
    if (typeof Buffer !== 'undefined' && Buffer.from) {
        return Buffer.from(str, 'utf8').toString('base64');
    }
    return btoa(str);
}


/**
 * Decode a base64 string back to a string.
 *
 * Prefers node's Buffer; falls back to the browser's atob().
 * @param str the base64 string to decode
 * @returns the decoded string
 */
export function Base64ToUtf8(str: string): string {
    if (typeof Buffer !== 'undefined' && Buffer.from) {
        return Buffer.from(str, 'base64').toString('utf8');
    }
    return atob(str);
}