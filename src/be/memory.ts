import type { ASTNode, FunctionDeclaration } from "../fe/ast";
import { uuid } from "./utils";

export type Pointer = string

//This code implements the runtime memory model for a language interpreter, based on the LEGB (Local, Enclosing, Global, Built-in) scoping rules

/*

Local scope: function parameters, local variables

Enclosing scope: outer function variables (closures!)

Global scope: top-level variables

Built-in scope: could be the root environment with built-in functions

*/ 

type BooleanValue = { type: 'boolean', value: boolean }
type NumberValue = { type: 'number', value: number }
type StringValue = { type: 'string', value: string }
type NullValue = { type: 'null' }

export type ArrayValue = { type: 'array', elements: Pointer[] }

export type ObjectValue = { type: 'object', properties: Record<string, Pointer> }


export type FunctionValue =
    { type: 'builtinfunction', impl: (args: Pointer[]) => Pointer }
    | { type: 'function', node: FunctionDeclaration, parentEnv: LexicalEnvironment }
//user-defined, storing the AST node and its closure environment

/*

These need:

node: The AST (Abstract Syntax Tree) of the function body - because the interpreter needs to walk through and execute each statement in the function

parentEnv: The enclosing environment - to capture the closure (variables from where the function was defined)


Built-in Functions: print(), .len
impl: A direct TypeScript function implementation


Don't access variables from the defining scope because they:

Run native TypeScript code, not your language's code
Don't have access to your language's variable system
Operate directly on the heap and pointers


User functions run INSIDE your language's execution model

Built-in functions run OUTSIDE your language, but can manipulate its memory

*/ 

export type PrimitiveValue = BooleanValue | NumberValue | StringValue | NullValue

//all possible runtime values the language can handle:
export type RuntimeValue = PrimitiveValue | ArrayValue | ObjectValue | FunctionValue


export function isPrimitive(v: RuntimeValue): v is PrimitiveValue {
    return v.type === 'boolean' || v.type === 'number' || v.type === 'string' || v.type === 'null'
}

export function coerceStr(v: PrimitiveValue): string {
    switch (v.type) {
        case "string":
            return v.value
        case "number":
        case "boolean":
            return String(v.value)
        case "null":
            return "null"
    }
}

export function isTruthy(v: RuntimeValue): boolean {
    if (v.type === 'string' && v.value === '') {
        return false
    }
    if (v.type === 'number' && v.value === 0) {
        return false
    }
    if (v.type === 'boolean' && !v.value) {
        return false
    }
    if (v.type === 'null') {
        return false
    }

    return true
}

export function isPrimitiveEqual(a: PrimitiveValue, b: PrimitiveValue): boolean {
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
    private readonly storage: Record<Pointer, RuntimeValue> = {}

    // Stores a value and returns its pointer
    set(value: RuntimeValue) {
        const ptr = uuid()
        this.storage[ptr] = value
        return ptr
    }

    //Retrieves a value by pointer (throws on invalid pointer - "segmentation fault")
    get(ptr: Pointer): RuntimeValue {
        const value = this.storage[ptr]
        if (value === undefined) {
            throw new Error(`Segmentation fault: invalid pointer ${ptr}`)
        }
        return value
    }

    all(): Record<Pointer, RuntimeValue> {
        return this.storage
    }
}

export type VarName = string

/*
    implements the LEGB scoping chain
    
    Each environment is a scope that maps variable names → heap pointers

*/ 
export class LexicalEnvironment {
    private readonly variables: Record<VarName, Pointer> = {}
    private readonly parent?: LexicalEnvironment

    constructor(parent?: LexicalEnvironment) {
        this.parent = parent
    }

    //sets in the current environment (creating local variables)
    set(name: string, ptr: Pointer) {
        this.variables[name] = ptr
    }

    // Looks up a variable in current scope, then recursively checks parent scopes (implementing LEGB)
    get(name: string): Pointer | undefined {
        const ptr = this.variables[name]
        if (ptr !== undefined) {
            return ptr
        }
        if (this.parent) {
            return this.parent.get(name)
        }
    }

    all(): Record<VarName, Pointer> {
        return this.variables
    }
}

interface Frame {
    id: string
    fn: string // Function name (for debugging) , empty for global i.e no fucntions present
    curr: ASTNode //Current AST node being executed

    env: LexicalEnvironment //The lexical environment for this function call
}

/*
Tracks execution context during function calls.
Tracking which function is currently executing
Maintaining proper scoping (each call gets its own environment)
Closures: When a function accesses variables from its enclosing scope, the environment chain preserves those variables

*/

export class CallStack {
    private readonly frames: Frame[] = []

    push(fn: string, curr: ASTNode, env: LexicalEnvironment) {
        this.frames.push({ id: uuid(), fn, curr, env })
    }

    pop() {
        return this.frames.pop()
    }

    peek(): Frame {
        return this.frames[this.frames.length - 1]!
    }

    all(): Frame[] {
        return this.frames
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