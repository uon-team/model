import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ValidateRange } from './number.validator';
import { Required } from './required.validator';
import { Prohibited } from './prohibited.validator';
import { ValidateOneOf } from './equality.validator';
import { ValidatePattern, ValidateMongoId, MinLength, MaxLength, MONGO_ID_REGEX } from './string.validator';
import { ValidateEmail } from './email.validator';
import { ValidatePhone } from './phone.validator';
import { ValidationFailure } from '../base/validation';

function run(validator: any, val: any) {
    return validator({}, 'field', val);
}

describe('ValidateRange', () => {
    const v = ValidateRange(1, 10);

    test('accepts a value within range', () => {
        assert.equal(run(v, 5), 5);
    });

    test('rejects a value below min', () => {
        assert.throws(() => run(v, 0), ValidationFailure);
    });

    test('rejects a value above max', () => {
        assert.throws(() => run(v, 11), ValidationFailure);
    });

    test('rejects a non-number', () => {
        assert.throws(() => run(v, 'x' as any), ValidationFailure);
    });

    // regression: NaN is typeof 'number' and used to slip through the comparisons
    test('rejects NaN', () => {
        assert.throws(() => run(v, NaN), ValidationFailure);
    });

    test('null min/max omit the corresponding bound', () => {
        const open = ValidateRange(null as any, null as any);
        assert.equal(run(open, 99999), 99999);
    });
});

describe('Required', () => {
    const v = Required();

    test('accepts a non-empty value', () => {
        assert.equal(run(v, 'x'), 'x');
    });

    test('rejects null, undefined, empty string and NaN', () => {
        assert.throws(() => run(v, null), ValidationFailure);
        assert.throws(() => run(v, undefined), ValidationFailure);
        assert.throws(() => run(v, ''), ValidationFailure);
        assert.throws(() => run(v, NaN), ValidationFailure);
    });

    test('is marked as a force-validation validator', () => {
        assert.equal((v as any)._forceValidation, true);
    });
});

describe('Prohibited', () => {
    const v = Prohibited();

    // regression: condition was `!== null || !== undefined` (always true)
    test('accepts null and undefined', () => {
        assert.equal(run(v, null), null);
        assert.equal(run(v, undefined), undefined);
    });

    test('rejects any actual value', () => {
        assert.throws(() => run(v, 0), ValidationFailure);
        assert.throws(() => run(v, ''), ValidationFailure);
        assert.throws(() => run(v, 'x'), ValidationFailure);
    });
});

describe('ValidateOneOf', () => {
    const v = ValidateOneOf(['a', 'b']);
    test('accepts a listed value', () => assert.equal(run(v, 'a'), 'a'));
    test('rejects an unlisted value', () => assert.throws(() => run(v, 'c'), ValidationFailure));
});

describe('string validators', () => {
    test('ValidatePattern accepts/rejects by regex', () => {
        const v = ValidatePattern(/^\d+$/);
        assert.equal(run(v, '123'), '123');
        assert.throws(() => run(v, 'abc'), ValidationFailure);
    });

    test('ValidateMongoId accepts a 24-hex id, rejects junk', () => {
        const v = ValidateMongoId();
        assert.equal(run(v, 'a'.repeat(24)), 'a'.repeat(24));
        assert.throws(() => run(v, 'nope'), ValidationFailure);
        assert.ok(MONGO_ID_REGEX.test('0123456789abcdef01234567'));
    });

    test('MinLength / MaxLength enforce bounds and pass through null', () => {
        assert.throws(() => run(MinLength(3), 'ab'), ValidationFailure);
        assert.equal(run(MinLength(3), 'abc'), 'abc');
        assert.throws(() => run(MaxLength(3), 'abcd'), ValidationFailure);
        assert.equal(run(MaxLength(3), null), null);
    });
});

describe('email / phone validators', () => {
    test('ValidateEmail accepts a valid address, rejects an invalid one', () => {
        const v = ValidateEmail();
        assert.equal(run(v, 'a@b.com'), 'a@b.com');
        assert.throws(() => run(v, 'not-an-email'), ValidationFailure);
    });

    test('ValidatePhone accepts a US number, rejects junk', () => {
        const v = ValidatePhone();
        assert.equal(run(v, '555-555-5555'), '555-555-5555');
        assert.throws(() => run(v, '12'), ValidationFailure);
    });
});
