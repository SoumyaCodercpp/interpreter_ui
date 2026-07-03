interface Position {
    line: number;
    col: number;
    i: number;
}
export interface Location {
    start: Position;
    end: Position;
}
interface BaseToken {
    loc: Location;
}
type KeywordType = 'if' | 'else' | 'while' | 'true' | 'false' | 'null' | 'fn' | 'return';
interface KeywordToken extends BaseToken {
    type: KeywordType;
}
export interface IdentifierToken extends BaseToken {
    type: 'identifier';
    val: string;
}
interface StringToken extends BaseToken {
    type: 'string';
    val: string;
}
interface NumberToken extends BaseToken {
    type: 'number';
    val: number;
}
type SymbolType = '(' | ')' | '[' | ']' | '{' | '}' | '.' | ',' | '+' | '-' | '*' | '/' | '%' | '&&' | '||' | '!' | '<' | '>' | '=' | '<=' | '>=' | '==' | '!=' | ';' | ':';
interface SymbolToken extends BaseToken {
    type: SymbolType;
}
interface EOFToken extends BaseToken {
    type: 'EOF';
}
type TokenType = KeywordType | 'identifier' | 'string' | 'number' | SymbolType | 'EOF';
export type Token = KeywordToken | IdentifierToken | StringToken | NumberToken | SymbolToken | EOFToken;
export declare class Tokenizer {
    private readonly program;
    private readonly inc;
    constructor(program: string);
    tokenize(): Token[];
    identifierOrKeyword(): IdentifierToken | KeywordToken;
    num(): NumberToken;
    str(): StringToken;
    twoCharSym(): SymbolToken;
    oneCharSym(): SymbolToken;
}
export declare class TokenManager {
    private readonly tokens;
    private i;
    constructor(tokens: Token[]);
    peek(): Token;
    eat(types?: TokenType | TokenType[]): Token;
}
export {};
