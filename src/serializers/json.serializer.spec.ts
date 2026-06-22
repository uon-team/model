import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Model } from '../meta/model.decorator';
import { Member } from '../meta/member.decorator';
import { ArrayMember } from '../meta/array.decorator';
import { JsonSerializer } from './json.serializer';

@Model()
class Tag {
    @Member() name: string;
}

@Model()
class Post {
    @Member() title: string;
    @Member() views: number;
    @Member() published: boolean;
    @Member() created: Date;
    @ArrayMember(Tag) tags: Tag[];
}

describe('JsonSerializer', () => {
    const ser = new JsonSerializer(Post);

    test('serializes primitive members (incl. falsy)', () => {
        const p = Model.New(Post, { title: 't', views: 0, published: false });
        const json = ser.serialize(p) as any;
        assert.equal(json.title, 't');
        assert.equal(json.views, 0);
        assert.equal(json.published, false);
    });

    test('round-trips through serialize/deserialize', () => {
        const created = new Date('2020-01-02T03:04:05.000Z');
        const p = Model.New(Post, {
            title: 'Hello',
            views: 42,
            published: true,
            created,
            tags: [Model.New(Tag, { name: 'a' }), Model.New(Tag, { name: 'b' })],
        });

        const json = ser.serialize(p) as any;
        const back = ser.deserialize(json);

        assert.equal(back.title, 'Hello');
        assert.equal(back.views, 42);
        assert.equal(back.published, true);
        assert.equal(back.created.getTime(), created.getTime());
        assert.equal(back.tags.length, 2);
        assert.equal(back.tags[0].name, 'a');
        assert.ok(back instanceof Post);
        assert.ok(back.tags[0] instanceof Tag);
    });

    test('omits undefined members but keeps null', () => {
        const p = Model.New(Post, { title: 'only' });
        const json = ser.serialize(p) as any;
        assert.equal(json.title, 'only');
        assert.ok(!('views' in json));
    });

    test('serializes null model instance to null', () => {
        assert.equal(ser.serialize(null as any), null);
    });

    test('JSON.stringify uses the generated toJSON', () => {
        const p = Model.New(Post, { title: 'x', views: 1 });
        const str = JSON.stringify(p);
        const obj = JSON.parse(str);
        assert.equal(obj.title, 'x');
        assert.equal(obj.views, 1);
    });

    test('mutationsOnly serializes only changed fields', () => {
        const p = ser.deserialize({ title: 'orig', views: 1, published: true });
        // deserialize clears mutations; now mutate one field
        p.title = 'changed';
        const partial = ser.serialize(p, true) as any;
        assert.equal(partial.title, 'changed');
        assert.ok(!('views' in partial));
    });
});
