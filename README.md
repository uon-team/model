# UON Model

A decorator-based schema/model library with json and binary (de)serialization.

## Getting started

Install @uon/model using npm

```shell
    npm i @uon/model
```

## Usage

Model definitions are expressed in the following way:

```typescript

import { Model, Member, ArrayMember } from '@uon/model'

@Model()
export class MyModel {

    // Generic member supports String, Boolean, Number and Date types
    @Member() myStringField: string;

    // For array members you need to specify the array element type
    // as a decorator argument due to TypeScript not emiting array element type
    @ArrayMember(String) myArrayField: string[];


}
```

### TypedNumber

In order to efficiently serialize to binary, number types have been added.

Generic members with type Number are treated as Float64.

```typescript
@Model()
export class MyModel {

    // Supported number types are Int8, Int16, Int32, Uint8, Uint16, Uint32, Float32 and Float64
    @NumberMember(Uint8) myByte: number;

    // You can also use a TypedNumber as array element type 
    @ArrayMember(Uint32) myNumberArray: number[];

}

```

### Serialization

To serialize a model instance:

```typescript
let obj = new MyModel();
let serializer = new JsonSerializer(MyModel);
let serialized_str = JSON.stringify(serializer.serialize(obj));
```
Note that serializer.serialize does not return a JSON string but rather a JSON object using only builtin types (String, Number, Boolean, Array, Object and Date).

### Deserialization
To deserialize, we do the following:
```typescript
let serializer = new JsonSerializer(MyModel);
let my_obj = serializer.deserialize(JSON.parse(my_json_str));
```

## Limitations

- Array members are limited to 1 dimension, n-dimensional arrays might be supported in the future.


## TODO

- Add serialization support for builtin typed arrays line Uint8Array, etc...
- Handle array element validation, also TypedNumbers range
- Complete this README

