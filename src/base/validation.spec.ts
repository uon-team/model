import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Model } from '../meta/model.decorator';
import { Member } from '../meta/member.decorator';
import { Validate, ValidationResult, ModelValidationResult } from './validation';
import { Required } from '../validators/required.validator';
import { ValidateRange } from '../validators/number.validator';
import { ValidateModel } from '../validators/model.validator';

@Model()
class Address {
    @Member({ validators: [Required()] })
    street!: string;
}

@Model()
class User {
    @Member({ validators: [Required()] })
    name!: string;

    @Member({ validators: [ValidateRange(0, 120)] })
    age!: number;

    @Member({ validators: [ValidateModel()] })
    address!: Address;
}

describe('Validate', () => {
    test('a fully valid model reports valid', async () => {
        const u = Model.New(User, {
            name: 'Ann',
            age: 30,
            address: Model.New(Address, { street: 'Main' }),
        });
        const result = await Validate(u);
        assert.equal(result.valid, true);
    });

    test('flags a missing required field', async () => {
        const u = Model.New(User, {
            name: '',
            age: 30,
            address: Model.New(Address, { street: 'Main' }),
        });
        const result = await Validate(u);
        assert.equal(result.valid, false);
        assert.ok(result.children['name'] instanceof ValidationResult);
        assert.equal(result.children['name'].valid, false);
    });

    test('flags an out-of-range number', async () => {
        const u = Model.New(User, {
            name: 'Ann',
            age: 999,
            address: Model.New(Address, { street: 'Main' }),
        });
        const result = await Validate(u);
        assert.equal(result.valid, false);
        assert.equal(result.children['age']!.valid, false);
    });

    // regression: an embedded ModelValidationResult used to be pushed into its
    // own failures[] array, corrupting the tree and breaking flatten()
    test('nested model validation produces a clean child result', async () => {
        const u = Model.New(User, {
            name: 'Ann',
            age: 30,
            address: Model.New(Address, { street: undefined }),
        });
        const result = await Validate(u);

        assert.equal(result.valid, false);

        const child = result.children['address'] as ModelValidationResult<Address>;
        assert.ok(child instanceof ModelValidationResult);

        // the child must not contain itself (or any result) in its failures list
        for (const f of child.failures) {
            assert.ok(!(f instanceof ValidationResult));
        }

        // the actual failure lives under the embedded model's own child
        assert.equal(child.children['street']!.valid, false);
    });

    test('flatten() does not throw and lists the offending paths', async () => {
        const u = Model.New(User, {
            name: '',
            age: 30,
            address: Model.New(Address, { street: undefined }),
        });
        const result = await Validate(u);
        let flat: any[];
        assert.doesNotThrow(() => { flat = result.flatten(); });
        assert.ok(flat!.length > 0);
    });
});

describe('ModelValidationResult.valid', () => {
    test('true when no failures and no invalid children', () => {
        const r = new ModelValidationResult<any>('root');
        assert.equal(r.valid, true);
    });

    test('false when a child is invalid', () => {
        const r = new ModelValidationResult<any>('root');
        const child = new ValidationResult<any>('field');
        child.failures.push({ validator: function x() {}, key: 'field', value: 1, context: {} } as any);
        (r.children as any)['field'] = child;
        assert.equal(r.valid, false);
    });
});
