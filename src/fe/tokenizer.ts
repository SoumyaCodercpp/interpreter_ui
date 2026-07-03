interface Position {
    line: number
    col: number
    i: number
}

export interface Location {
    start: Position
    end: Position
}

interface BaseToken {
    loc: Location
}

//HERE ALL INTERFACES ACTS AS DIFFERENT TOKENS

type KeywordType = 'if' | 'else' | 'while' | 'true' | 'false' | 'null' | 'fn' | 'return' | 'print'
interface KeywordToken extends BaseToken {
    type: KeywordType
}

export interface IdentifierToken extends BaseToken {
    type: 'identifier'
    val: string
}

interface StringToken extends BaseToken {
    type: 'string'
    val: string
}

interface NumberToken extends BaseToken {
    type: 'number'
    val: number
}

type SymbolType = '(' | ')' | '[' | ']' | '{' | '}' | '.' | ',' | '+' | '-' | '*' | '/' | '%' | '&&' | '||' | '!' | '<' | '>' | '=' | '<=' | '>=' | '==' | '!=' | ';' | ':'
interface SymbolToken extends BaseToken {
    type: SymbolType
}

interface EOFToken extends BaseToken {
    type: 'EOF'
}

type TokenType = KeywordType | 'identifier' | 'string' | 'number' | SymbolType | 'EOF'
export type Token = KeywordToken | IdentifierToken | StringToken | NumberToken | SymbolToken | EOFToken

class Incrementer {
    private readonly position: Position = { line: 1, col: 1, i: 0 }

    inc() {
        this.position.i++
        this.position.col++
    }

    newline() {
        this.position.line++
        this.position.col = 1
    }

    pos(): Position {
        return { ...this.position }
    }

    i(): number {
        return this.position.i
    }
}

export class Tokenizer {
    private readonly program: string
    private readonly inc: Incrementer = new Incrementer()

    constructor(program: string) {
        this.program = program
    }

    tokenize() {
        const tokens: Token[] = []

        while (this.inc.i() < this.program.length) {
            const c = this.program[this.inc.i()]
            if (c === undefined) {
                throw new Error("Unexpected end of input")
            }

            if (isAlpha(c)) {
                tokens.push(this.identifierOrKeyword())
                continue
            }

            if (isDigit(c)) {
                tokens.push(this.num())
                continue
            }

            if (c === '"') {
                tokens.push(this.str())
                continue
            }

            const d = this.program[this.inc.i() + 1]
            if (isTwoCharSym(`${c}${d}`)) {
                tokens.push(this.twoCharSym())
                continue
            }

            if (isOneCharSym(c)) {
                tokens.push(this.oneCharSym())
                continue
            }

            if (c === ' ') {
                this.inc.inc()
                continue
            }

            if (c === '\n') {
                this.inc.inc()
                this.inc.newline()
                continue
            }

            throw new Error(`Unexpected character: ${c}`)
        }
        tokens.push({ type: 'EOF', loc: { start: this.inc.pos(), end: this.inc.pos() } })
        return tokens
    }

    identifierOrKeyword(): IdentifierToken | KeywordToken {
        const start = this.inc.pos()

        let val = ''
        let c = this.program[this.inc.i()]
        if (c === undefined) {
            throw new Error("Unexpected end of input")
        }
        while (isAlphaNumeric(c)) {
            val += this.program[this.inc.i()]
            this.inc.inc()
            c = this.program[this.inc.i()]
            if (c === undefined) {
                throw new Error("Unexpected end of input")
            }
        }

        const end = this.inc.pos()
        if (isKeyword(val)) {
            return { type: val, loc: { start, end } }
        }

        return { type: 'identifier', val, loc: { start, end } }
    }

    num(): NumberToken {
        const start = this.inc.pos()

        let val = ''
        let c = this.program[this.inc.i()]
        if (c === undefined) {
            throw new Error("Unexpected end of input")
        }
        while (isDigit(c)) {
            val += this.program[this.inc.i()]
            this.inc.inc()
            c = this.program[this.inc.i()]
            if (c === undefined) {
                throw new Error("Unexpected end of input")
            }
        }

        if (this.program[this.inc.i()] === '.') {
            val += this.program[this.inc.i()]
            this.inc.inc()
            c = this.program[this.inc.i()]
            if (c === undefined) {
                throw new Error("Unexpected end of input")
            }
            while (isDigit(c)) {
                val += this.program[this.inc.i()]
                this.inc.inc()
                c = this.program[this.inc.i()]
                if (c === undefined) {
                    throw new Error("Unexpected end of input")
                }
            }
        }

        const end = this.inc.pos()

        return { type: 'number', val: Number(val), loc: { start, end } }
    }

    str(): StringToken {
        const start = this.inc.pos()

        this.inc.inc()

        let val = ''
        while (this.inc.i() < this.program.length && this.program[this.inc.i()] !== '"') {
            val += this.program[this.inc.i()]
            this.inc.inc()
        }

        this.inc.inc()

        const end = this.inc.pos()

        return { type: 'string', val, loc: { start, end } }
    }

    twoCharSym(): SymbolToken {
        const start = this.inc.pos()

        const c = this.program[this.inc.i()]
        const d = this.program[this.inc.i() + 1]

        this.inc.inc()
        this.inc.inc()

        const end = this.inc.pos()
        return { type: `${c}${d}` as SymbolType, loc: { start, end } }
    }

    oneCharSym(): SymbolToken {
        const start = this.inc.pos()

        const c = this.program[this.inc.i()]
        this.inc.inc()

        const end = this.inc.pos()

        return { type: c as SymbolType, loc: { start, end } }
    }
}

const keywords = new Set(['if', 'else', 'while', 'true', 'false', 'null', 'fn', 'return' , 'print'])
function isKeyword(s: string): s is KeywordType {
    return keywords.has(s)
}

const alpha = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
function isAlpha(c: string) {
    return alpha.has(c)
}

const digit = new Set('0123456789')
function isDigit(c: string) {
    return digit.has(c)
}

function isAlphaNumeric(c: string) {
    return isAlpha(c) || isDigit(c)
}

const oneCharSyms = new Set(['(', ')', '[', ']', '{', '}', '.', ',', '+', '-', '*', '/', '%', '!', '<', '>', '=', ';', ':'])
function isOneCharSym(c: string) {
    return oneCharSyms.has(c)
}

const twoCharSyms = new Set(['<=', '>=', '==', '!=', '&&', '||'])
function isTwoCharSym(cd: string) {
    return twoCharSyms.has(cd)
}

export class TokenManager {
  private readonly tokens: Token[]
  private i: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  // returns current token without moving forward.
  peek(): Token {
    return this.tokens[this.i]!
  }

  // Consumes current token
  eat(types?: TokenType | TokenType[]): Token {
    const currentToken = this.tokens[this.i]
    if (!currentToken) {
        throw new Error("Unexpected end of input")
    }
    
    if (typeof types === 'string') {
        types = [types]
    }

    if (types && types.length > 0 && !types.includes(currentToken.type)) {
        throw new Error(`Expected ${types.join(', ')} but got ${currentToken.type}`)
    }
    
    this.i++
    return currentToken
}
}

// let p: string = `while(true){
// count=count+1;
// }`;

// let t: Tokenizer = new Tokenizer(p);

// const tokens=t.tokenize();
// console.log(JSON.stringify(tokens))
