# @uon/model

A decorator-based schema/model library with JSON and binary (de)serialization,
validation, formatting and mutation tracking.

## Installation

```shell
npm i @uon/model
```

`@uon/model` builds on `@uon/core` (peer dependency) and relies on emitted
decorator metadata. Your `tsconfig.json` must enable:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

and `reflect-metadata` must be imported once at your app entry point (it is
imported by `@uon/core`).

## Defining a model

```typescript
import { Model, Member, ArrayMember } from '@uon/model';

@Model()
export class MyModel {

    // Generic member — supports String, Boolean, Number and Date
    @Member()
    myStringField: string;

    // Array members must specify the element type (TS does not emit it)
    @ArrayMember(String)
    myArrayField: string[];
}
```

Supported member value types: `String`, `Boolean`, `Number` (treated as
`Float64`), `Date`, the typed-number wrappers below, other `@Model` types
(embedded models) and plain `Object`.

### Identity — `@ID`

Marks the primary key of a model. An ID is "forever clean" (it never registers
as a mutation) and is used to decide how embedded models are assigned/merged.

```typescript
@Model()
export class User {
    @ID() id: string;
    @Member() name: string;
}
```

### TypedNumber

For compact binary serialization, number types are provided. Generic `Number`
members are treated as `Float64`.

```typescript
import { Model, NumberMember, ArrayMember, Uint8, Uint32 } from '@uon/model';

@Model()
export class MyModel {
    // Int8, Int16, Int32, Uint8, Uint16, Uint32, Float32, Float64 (no (U)Int64 yet)
    @NumberMember(Uint8) myByte: number;

    // a TypedNumber can also be an array element type
    @ArrayMember(Uint32) myNumberArray: number[];
}
```

### Modelizing an external type

To let the serializers support a type you don't own, "modelize" it:

```typescript
import { Modelize, NumberMember, Float32 } from '@uon/model';
import { Vec2 } from 'some-math-lib';

Modelize(Vec2, {
    x: NumberMember(Float32),
    y: NumberMember(Float32),
});
```

## Instantiation helpers

```typescript
import { Model } from '@uon/model';

// create + populate
const u = Model.New(User, { id: '1', name: 'Ann' });

// merge values into an existing instance (embedded models are merged, not replaced)
Model.Assign(u, { name: 'Annie' });
```

## JSON serialization

Serialize either manually via `JsonSerializer` or by passing the instance to
`JSON.stringify()` (each `@Model` gets a generated `toJSON`).

```typescript
import { JsonSerializer } from '@uon/model';

const serializer = new JsonSerializer(MyModel);

// serialize returns a plain JS object (String/Number/Boolean/Array/Object/Date),
// not a string
const plain = serializer.serialize(obj);

// pass mutationsOnly = true to serialize only fields changed since the last clean
const partial = serializer.serialize(obj, true);

// deserialize back to a typed instance
const obj2 = serializer.deserialize(JSON.parse(jsonString));
```

## Binary serialization

`BinarySerializer` (de)serializes a model to/from an `ArrayBuffer`. Note: `null`
values are treated as undefined (omitted), and a model may have at most 256
members (member indices are stored as a byte). Deserialization validates lengths
and throws a descriptive error on a malformed/truncated buffer.

```typescript
import { BinarySerializer } from '@uon/model';

const bin = new BinarySerializer(MyModel);
const buffer = bin.serialize(obj);     // ArrayBuffer
const obj2 = bin.deserialize(buffer);  // MyModel
```

## Validation

Attach validators per member and run `Validate()`:

```typescript
import { Model, Member, Validate, Required, ValidateRange, ValidateEmail } from '@uon/model';

@Model()
export class Signup {
    @Member({ validators: [Required(), ValidateEmail()] }) email: string;
    @Member({ validators: [ValidateRange(13, 120)] }) age: number;
}

const result = await Validate(Model.New(Signup, { email: 'bad', age: 5 }));

if (!result.valid) {
    // result is a ModelValidationResult<T>
    const flat = result.flatten(); // [{ path, errors }, ...]
}
```

Built-in validators: `Required`, `Prohibited`, `ValidateOneOf`, `ValidateRange`,
`ValidatePattern`, `ValidateMongoId`, `MinLength`, `MaxLength`, `ValidateEmail`,
`ValidatePhone`, and `ValidateModel` (validate an embedded `@Model`). Validators
are plain functions `(model, key, value, injector?) => value`, so you can write
your own; throw a `ValidationFailure` to signal an error.

`Validate()` returns a `ModelValidationResult<T>`:

| Member | Description |
|--------|-------------|
| `valid` | `true` when there are no failures and no invalid children |
| `failures` | `ValidationFailure[]` for this node |
| `children` | per-field `ValidationResult` / `ModelValidationResult` |
| `flatten(out?, path?)` | flatten the tree into `{ path, errors }[]` |
| `filter(ignored)` | a copy with the given validators removed |

## Formatting

Formatters transform field values in place. Run `ApplyFormatting()`:

```typescript
import { Model, Member, ApplyFormatting } from '@uon/model';

@Model()
export class Account {
    @Member({ formatters: [(t, k, v) => String(v).trim().toLowerCase()] })
    handle: string;
}

const a = Model.New(Account, { handle: '  ALICE ' });
ApplyFormatting(a); // a.handle === 'alice'
```

Formatters run for every present field value, including falsy ones (`0`, `false`,
`''`); only `undefined`/`null` are skipped.

## Mutation tracking

Decorated members are backed by getters/setters that flag changed fields. This
powers `serialize(obj, true)` (serialize only what changed).

```typescript
import { Model } from '@uon/model';

const u = Model.New(User, { id: '1', name: 'Ann' });
Model.MakeClean(u);          // clear all flags
u.name = 'Annie';            // flags `name` dirty
Model.HasMutations(u);       // true
Model.GetMutations(u);       // { name: true }
Model.MakeDirty(u, 'name');  // flag a field manually
Model.MakeClean(u, ['name']); // clear specific fields
```

## API reference (barrel exports)

- Decorators: `Model`, `Member`, `ID`, `ArrayMember`, `NumberMember`, `Modelize`
- Number types: `TypedNumber`, `Int8`/`Int16`/`Int32`/`Uint8`/`Uint16`/`Uint32`/`Float32`/`Float64`
- Serializers: `JsonSerializer`, `BinarySerializer`
- Validation: `Validate`, `ValidationResult`, `ModelValidationResult`, `ValidationFailure`, `Validator`, and the built-in validators listed above
- Formatting: `ApplyFormatting`, `Formatter`
- Mutation: `Model.MakeClean/MakeDirty/GetMutations/HasMutations`, `Mutations`, `ArrayMutation`
- Utilities: `FindModelAnnotation`, `GetModelMembers`, `GetModelMembersMap`, `GetMemberForKey`, `Utf8ToBase64`, `Base64ToUtf8`
- Regex constants: `MONGO_ID_REGEX`, `EMAIL_REGEXP`, `AMERICA_REGEXP`

## Limitations

- Array members are limited to 1 dimension (n-dimensional arrays may come later).
- Binary serialization: no (U)Int64; built-in typed arrays (Uint8Array, …) are
  not yet supported; a model is limited to 256 members.

## License

MIT
