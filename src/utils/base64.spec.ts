import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Utf8ToBase64, Base64ToUtf8 } from './base64';

describe('base64', () => {
    // regression: Utf8ToBase64/Base64ToUtf8 previously did the inverse of their
    // names (atob/btoa swapped) and broke on modern node (global atob/btoa)
    test('Utf8ToBase64 encodes a string to base64', () => {
        assert.equal(Utf8ToBase64('hello'), 'aGVsbG8=');
    });

    test('Base64ToUtf8 decodes a base64 string', () => {
        assert.equal(Base64ToUtf8('aGVsbG8='), 'hello');
    });

    test('round-trips an ascii string', () => {
        const s = 'The quick brown fox';
        assert.equal(Base64ToUtf8(Utf8ToBase64(s)), s);
    });

    test('round-trips a UTF-8 (multibyte) string', () => {
        const s = 'héllo — wörld 你好';
        assert.equal(Base64ToUtf8(Utf8ToBase64(s)), s);
    });

    test('round-trips the empty string', () => {
        assert.equal(Base64ToUtf8(Utf8ToBase64('')), '');
    });
});
