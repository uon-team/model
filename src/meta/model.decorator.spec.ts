import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Model, Modelize } from './model.decorator';
import { Member } from './member.decorator';
import { FindModelAnnotation, GetModelMembers } from '../utils/model.utils';

@Model()
class Widget {
    @Member() name!: string;
    @Member() count!: number;
}

describe('@Model decorator', () => {
    test('attaches model metadata discoverable via FindModelAnnotation', () => {
        const meta = FindModelAnnotation(Widget);
        assert.ok(meta);
        assert.equal(meta.type, Widget);
    });

    test('registers members', () => {
        const meta = FindModelAnnotation(Widget);
        const members = GetModelMembers(meta);
        const keys = members.map(m => m.key).sort();
        assert.deepEqual(keys, ['count', 'name']);
    });

    test('replaces fields with getter/setter storage', () => {
        const w = new Widget();
        w.name = 'hello';
        assert.equal(w.name, 'hello');
    });
});

describe('mutation tracking', () => {
    test('a plain new instance has no mutations', () => {
        const w = new Widget();
        assert.equal(Model.HasMutations(w), false);
    });

    test('setting a field flags it dirty', () => {
        const w = new Widget();
        w.name = 'x';
        assert.equal(Model.HasMutations(w), true);
        assert.equal((Model.GetMutations(w) as any).name, true);
    });

    test('setting to the same value does not flag dirty', () => {
        const w = new Widget();
        Model.MakeClean(w);
        // generic setter only flags when the value actually changes
        const data = (w as any);
        w.count = 5;
        Model.MakeClean(w);
        w.count = 5; // same value
        assert.equal((Model.GetMutations(w) as any).count, undefined);
    });

    test('MakeClean clears mutation flags', () => {
        const w = new Widget();
        w.name = 'x';
        Model.MakeClean(w);
        assert.equal(Model.HasMutations(w), false);
    });

    test('MakeDirty marks a field', () => {
        const w = new Widget();
        Model.MakeDirty(w, 'count');
        assert.equal((Model.GetMutations(w) as any).count, true);
    });
});

describe('Model.New / Model.Assign', () => {
    test('New creates and populates an instance', () => {
        const w = Model.New(Widget, { name: 'a', count: 3 });
        assert.ok(w instanceof Widget);
        assert.equal(w.name, 'a');
        assert.equal(w.count, 3);
    });

    test('Assign merges values into an existing instance', () => {
        const w = Model.New(Widget, { name: 'a', count: 1 });
        Model.Assign(w, Model.New(Widget, { count: 9 }));
        assert.equal(w.name, 'a');
        assert.equal(w.count, 9);
    });

    test('Assign ignores null/undefined args', () => {
        const w = Model.New(Widget, { name: 'a' });
        assert.doesNotThrow(() => Model.Assign(w, null, undefined));
        assert.equal(w.name, 'a');
    });
});

describe('Modelize', () => {
    test('decorates an existing plain class', () => {
        class Plain {
            label!: string;
        }
        Reflect.defineMetadata('design:type', String, Plain.prototype, 'label');
        Modelize(Plain, { label: Member() } as any);

        const meta = FindModelAnnotation(Plain);
        assert.ok(meta);
        const inst = Model.New(Plain as any, { label: 'hi' });
        assert.equal((inst as any).label, 'hi');
    });
});
