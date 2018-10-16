# UON Model

A database agnostic, decorator-based schema/model library.

## Getting started

Install @uon/model using npm

```shell
    npm i @uon/model
```

## Usage

Model definitions are expressed in the following way:

```typescript

import { Model, Field, ID } from '@uon/model'

@Model()
export class MyModel {

    @Field() myStringField: string;

    @Field() myObjField: object;

    // for array fields you need to specify the array element type
    // as a decorator argument due to TypeScript not emiting array element type
    @Field(String) myArrayField: string[]

}
```

## TypeManager
The TypeManager static class serves a repository for serializable type. When a type is decorated with @Model(), the type is registered with TypeManager.


### Serialization

Only JSON serialization is supported as of now. Binary serialization is in the works.

To serialize a instance or array of instances you can use:

```typescript
let obj = new MyModel();
let serialized = JSON.stringify(TypeManager.Serialize(MyModel, obj));
```
Note that TypeManager.Serialize does not return a JSON string but rather a JSON object using only basic types (String, Number, Boolean, Array, Object and Date).

### Deserialization
To deserialize, we do the following:
```typescript
let json_obj = JSON.parse(my_json_str);
let my_obj = TypeManager.Deserialize(MyModel, json_obj);
```

## Limitations

- Cannot yet have an array of arrays as field definition


## Future

- Binary serialization (add number types)
- Move JSON serialization to own interface (ditching TypeManager)