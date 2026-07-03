import { type ArrayValue, Heap, type ObjectValue, type PrimitiveValue, type RuntimeValue } from "./memory.js";
export declare function printPrimitive(v: PrimitiveValue): string;
export declare function printObject(heap: Heap, v: ObjectValue): string;
export declare function printArray(heap: Heap, v: ArrayValue): string;
export declare function printAny(heap: Heap, v: RuntimeValue): string;
