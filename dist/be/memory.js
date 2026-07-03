import { uuid } from "./utils.js";
export function isPrimitive(v) {
    return v.type === 'boolean' || v.type === 'number' || v.type === 'string' || v.type === 'null';
}
export function coerceStr(v) {
    switch (v.type) {
        case "string":
            return v.value;
        case "number":
        case "boolean":
            return String(v.value);
        case "null":
            return "null";
    }
}
export function isTruthy(v) {
    if (v.type === 'string' && v.value === '') {
        return false;
    }
    if (v.type === 'number' && v.value === 0) {
        return false;
    }
    if (v.type === 'boolean' && !v.value) {
        return false;
    }
    if (v.type === 'null') {
        return false;
    }
    return true;
}
export function isPrimitiveEqual(a, b) {
    if (a.type === 'number' && b.type === 'number') {
        return a.value === b.value;
    }
    if (a.type === 'string' && b.type === 'string') {
        return a.value === b.value;
    }
    if (a.type === 'boolean' && b.type === 'boolean') {
        return a.value === b.value;
    }
    if (a.type === 'null' && b.type === 'null') {
        return true;
    }
    return false;
}
/*
   Heap:central storage system where all runtime values live

   Instead of storing values directly in variables, the heap stores them at unique pointers (UUIDs)

   Variables hold pointers, not values directly ---> enables  multiple variables can point to the same object/array

*/
export class Heap {
    constructor() {
        this.storage = {};
    }
    // Stores a value and returns its pointer
    set(value) {
        const ptr = uuid();
        this.storage[ptr] = value;
        return ptr;
    }
    //Retrieves a value by pointer (throws on invalid pointer - "segmentation fault")
    get(ptr) {
        const value = this.storage[ptr];
        if (value === undefined) {
            throw new Error(`Segmentation fault: invalid pointer ${ptr}`);
        }
        return value;
    }
    all() {
        return this.storage;
    }
}
/*
    implements the LEGB scoping chain
    
    Each environment is a scope that maps variable names → heap pointers

*/
export class LexicalEnvironment {
    constructor(parent) {
        this.variables = {};
        this.parent = parent;
    }
    //sets in the current environment (creating local variables)
    set(name, ptr) {
        this.variables[name] = ptr;
    }
    // Looks up a variable in current scope, then recursively checks parent scopes (implementing LEGB)
    get(name) {
        const ptr = this.variables[name];
        if (ptr !== undefined) {
            return ptr;
        }
        if (this.parent) {
            return this.parent.get(name);
        }
    }
    all() {
        return this.variables;
    }
}
/*
Tracks execution context during function calls.
Tracking which function is currently executing
Maintaining proper scoping (each call gets its own environment)
Closures: When a function accesses variables from its enclosing scope, the environment chain preserves those variables

*/
export class CallStack {
    constructor() {
        this.frames = [];
    }
    push(fn, curr, env) {
        this.frames.push({ id: uuid(), fn, curr, env });
    }
    pop() {
        return this.frames.pop();
    }
    peek() {
        return this.frames[this.frames.length - 1];
    }
    all() {
        return this.frames;
    }
}
/*

let x = 5;            Heap: {ptr1: {type:'number', value:5}}
                      Global env: {x: ptr1}

function foo() {      Heap: {ptr1: ..., ptr2: {type:'function', node:..., parentEnv: globalEnv}}
    let y = 10;       Global env: {x: ptr1, foo: ptr2}
    return x + y;     When foo() called:
}                       - New LexicalEnvironment created with parent=globalEnv
                        - Call stack pushes new frame
foo();                  - y resolves in local env
                        - x resolves by walking up to global env

*/ 
//# sourceMappingURL=memory.js.map