import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Model } from '../meta/model.decorator';
import { Member } from '../meta/member.decorator';
import { ArrayMember } from '../meta/array.decorator';
import { BinarySerializer } from './binary.serializer';

@Model()
class Item {
    @Member() label: string;
    @Member() qty: number;
    @Member() active: boolean;
    @ArrayMember(Number) scores: number[];
}

describe('BinarySerializer', () => {
    const ser = new BinarySerializer(Item);

    test('round-trips a model through an ArrayBuffer', () => {
        const item = Model.New(Item, {
            label: 'widget',
            qty: 7,
            active: true,
            scores: [1, 2, 3],
        });

        const buf = ser.serialize(item);
        assert.ok(buf instanceof ArrayBuffer);

        const back = ser.deserialize(buf);
        assert.equal(back.label, 'widget');
        assert.equal(back.qty, 7);
        assert.equal(back.active, true);
        // array members are wrapped in a mutation-tracking Proxy; compare values
        assert.deepEqual(Array.from(back.scores), [1, 2, 3]);
        assert.ok(back instanceof Item);
    });

    // regression (base64 fix): a UTF-8 string member must survive the round-trip
    test('round-trips a UTF-8 string member', () => {
        const item = Model.New(Item, { label: 'héllo 你好', qty: 1, active: false, scores: [] });
        const back = ser.deserialize(ser.serialize(item));
        assert.equal(back.label, 'héllo 你好');
    });

    // regression: deserializing an empty/truncated buffer must throw a clear
    // error instead of an opaque RangeError / out-of-bounds read
    test('throws a descriptive error on a truncated buffer', () => {
        assert.throws(() => ser.deserialize(new ArrayBuffer(0)), /Invalid buffer/);
        assert.throws(() => ser.deserialize(new ArrayBuffer(2)), /Invalid buffer/);
    });

    // regression: a malicious/garbage array length must not allocate/loop wildly
    test('throws on a bogus array length rather than allocating', () => {
        @Model()
        class ListOnly {
            @ArrayMember(Number) values: number[];
        }
        const s = new BinarySerializer(ListOnly);

        // hand-craft: defined-indices header [count=1][index=0], then array len = huge
        const buf = new ArrayBuffer(4 + 1 + 4);
        const dv = new DataView(buf);
        dv.setUint32(0, 1);          // 1 defined index
        dv.setUint8(4, 0);           // index 0
        dv.setUint32(5, 0xffffffff); // absurd array length
        assert.throws(() => s.deserialize(buf), /Invalid buffer/);
    });

    test('rejects a model with more than 256 members', () => {
        class Big {}
        for (let i = 0; i < 300; i++) {
            const key = 'f' + i;
            Reflect.defineMetadata('design:type', String, Big.prototype, key);
            (Member() as any)(Big.prototype, key);
        }
        (Model() as any)(Big);

        const s = new BinarySerializer(Big);
        assert.throws(() => s.serialize(new (Big as any)()), /at most 256 members/);
    });
});
