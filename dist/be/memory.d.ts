import type { ASTNode, FunctionDeclaration } from "../fe/ast.ts";
export type Pointer = string;
type BooleanValue = {
    type: 'boolean';
    value: boolean;
};
type NumberValue = {
    type: 'number';
    value: number;
};
type StringValue = {
    type: 'string';
    value: string;
};
type NullValue = {
    type: 'null';
};
export type ArrayValue = {
    type: 'array';
    elements: Pointer[];
};
export type ObjectValue = {
    type: 'object';
    properties: Record<string, Pointer>;
};
export type FunctionValue = {
    type: 'builtinfunction';
    impl: (args: Pointer[]) => Pointer;
} | {
    type: 'function';
    node: FunctionDeclaration;
    parentEnv: LexicalEnvironment;
};
export type PrimitiveValue = BooleanValue | NumberValue | StringValue | NullValue;
export type RuntimeValue = PrimitiveValue | ArrayValue | ObjectValue | FunctionValue;
export declare function isPrimitive(v: RuntimeValue): v is PrimitiveValue;
export declare function coerceStr(v: PrimitiveValue): string;
export declare function isTruthy(v: RuntimeValue): boolean;
export declare function isPrimitiveEqual(a: PrimitiveValue, b: PrimitiveValue): boolean;
export declare class Heap {
    private readonly storage;
    set(value: RuntimeValue): string;
    get(ptr: Pointer): RuntimeValue;
    all(): Record<Pointer, RuntimeValue>;
}
export type VarName = string;
export declare class LexicalEnvironment {
    private readonly variables;
    private readonly parent?;
    constructor(parent?: LexicalEnvironment);
    set(name: string, ptr: Pointer): void;
    get(name: string): Pointer | undefined;
    all(): Record<VarName, Pointer>;
}
interface Frame {
    id: string;
    fn: string;
    curr: ASTNode;
    env: LexicalEnvironment;
}
export declare class CallStack {
    private readonly frames;
    push(fn: string, curr: ASTNode, env: LexicalEnvironment): void;
    pop(): Frame | undefined;
    peek(): Frame;
    all(): Frame[];
}
export {};
