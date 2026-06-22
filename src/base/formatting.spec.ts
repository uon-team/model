import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Model } from '../meta/model.decorator';
import { Member } from '../meta/member.decorator';
import { ApplyFormatting } from './formatting';

@Model()
class Formatted {
    @Member({ formatters: [(t: any, k: string, v: any) => (v === '' ? 'EMPTY' : v)] })
    label: string;

    @Member({ formatters: [(t: any, k: string, v: any) => v + 10] })
    count: number;

    @Member({ formatters: [(t: any, k: string, v: any) => String(v).toUpperCase()] })
    code: string;
}

describe('ApplyFormatting', () => {
    test('applies formatters to non-falsy values', () => {
        const m = Model.New(Formatted, { label: 'x', count: 5, code: 'abc' });
        ApplyFormatting(m);
        assert.equal(m.code, 'ABC');
        assert.equal(m.count, 15);
    });

    // regression: formatters used to be skipped for falsy values (0, '', false)
    test('applies formatters to falsy values (empty string, zero)', () => {
        const m = Model.New(Formatted, { label: '', count: 0, code: 'z' });
        ApplyFormatting(m);
        assert.equal(m.label, 'EMPTY');
        assert.equal(m.count, 10);
    });

    test('skips members that are undefined/null', () => {
        const m = Model.New(Formatted, { code: 'q' });
        assert.doesNotThrow(() => ApplyFormatting(m));
        assert.equal(m.code, 'Q');
    });
});
