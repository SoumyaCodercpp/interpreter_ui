import { type ArrayValue, Heap, type ObjectValue, type PrimitiveValue, type RuntimeValue } from "./memory";


//When your program calls print("hello"), this file converts the runtime value { type: 'string', value: 'hello' } into the text "hello" that appears on screen


//Convert a primitive value (number, string, boolean, null) to its display string.
export function printPrimitive(v: PrimitiveValue): string {
  if (v.type === 'null') {
    return 'null'
  }
  if (v.type === 'string') {
    return `"${v.value}"` // if string wrap it in quotes for printing
  }

  return String(v.value)  // For numbers and booleans, just convert to string
}

//  Convert an object value to a string like { "name": "John", "age": 30 }.
export function printObject(heap: Heap, v: ObjectValue): string {
  const strs: string[] = []
  for (const [key, value] of Object.entries(v.properties)) {
    // key:string(property names) , value:Pointer
    strs.push(`"${key}": ${printAny(heap, heap.get(value))}`)
  }
  // strs = [ ' "name": "John" ' , ' "age": 30 ' ]

  return `{ ${strs.join(', ')} }` //Join all pairs with ", " and wrap in curly braces
}
// '{ "name": "John", "age": 30 }'

// Convert an array value to a string like [ 1, 2, 3 ].
export function printArray(heap: Heap, v: ArrayValue): string {
  const strs: string[] = []

  for (const elem of v.elements) {
    //elem-> pointer
    strs.push(printAny(heap, heap.get(elem)))
  }

  return `[ ${strs.join(', ')} ]`
}
// ' [ 1 , 2 , 3] '


// The Dispatcher
export function printAny(heap: Heap, v: RuntimeValue): string {
  switch (v.type) {
    case "string":
    case "number":
    case "boolean":
    case "null":
      return printPrimitive(v)
    case "object":
      return printObject(heap, v)
    case "array":
      return printArray(heap, v)
    case "function":
    case "builtinfunction":
      throw new Error(`Cannot print ${v.type}`)
  }
}

/*

Without conversion:
If we tried to display { type: 'number', value: 42 } directly, the user would see:
[object Object]

builtin.ts exists to turn internal values into human-readable text.


*/ 