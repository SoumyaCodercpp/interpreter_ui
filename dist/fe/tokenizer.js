class Incrementer {
    constructor() {
        this.position = { line: 1, col: 1, i: 0 };
    }
    inc() {
        this.position.i++;
        this.position.col++;
    }
    newline() {
        this.position.line++;
        this.position.col = 1;
    }
    pos() {
        return { ...this.position };
    }
    i() {
        return this.position.i;
    }
}
export class Tokenizer {
    constructor(program) {
        this.inc = new Incrementer();
        this.program = program;
    }
    tokenize() {
        const tokens = [];
        while (this.inc.i() < this.program.length) {
            const c = this.program[this.inc.i()];
            if (c === undefined) {
                throw new Error("Unexpected end of input");
            }
            if (isAlpha(c)) {
                tokens.push(this.identifierOrKeyword());
                continue;
            }
            if (isDigit(c)) {
                tokens.push(this.num());
                continue;
            }
            if (c === '"') {
                tokens.push(this.str());
                continue;
            }
            const d = this.program[this.inc.i() + 1];
            if (isTwoCharSym(`${c}${d}`)) {
                tokens.push(this.twoCharSym());
                continue;
            }
            if (isOneCharSym(c)) {
                tokens.push(this.oneCharSym());
                continue;
            }
            if (c === ' ') {
                this.inc.inc();
                continue;
            }
            if (c === '\n') {
                this.inc.inc();
                this.inc.newline();
                continue;
            }
            throw new Error(`Unexpected character: ${c}`);
        }
        tokens.push({ type: 'EOF', loc: { start: this.inc.pos(), end: this.inc.pos() } });
        return tokens;
    }
    identifierOrKeyword() {
        const start = this.inc.pos();
        let val = '';
        let c = this.program[this.inc.i()];
        if (c === undefined) {
            throw new Error("Unexpected end of input");
        }
        while (isAlphaNumeric(c)) {
            val += this.program[this.inc.i()];
            this.inc.inc();
            c = this.program[this.inc.i()];
            if (c === undefined) {
                throw new Error("Unexpected end of input");
            }
        }
        const end = this.inc.pos();
        if (isKeyword(val)) {
            return { type: val, loc: { start, end } };
        }
        return { type: 'identifier', val, loc: { start, end } };
    }
    num() {
        const start = this.inc.pos();
        let val = '';
        let c = this.program[this.inc.i()];
        if (c === undefined) {
            throw new Error("Unexpected end of input");
        }
        while (isDigit(c)) {
            val += this.program[this.inc.i()];
            this.inc.inc();
            c = this.program[this.inc.i()];
            if (c === undefined) {
                throw new Error("Unexpected end of input");
            }
        }
        if (this.program[this.inc.i()] === '.') {
            val += this.program[this.inc.i()];
            this.inc.inc();
            c = this.program[this.inc.i()];
            if (c === undefined) {
                throw new Error("Unexpected end of input");
            }
            while (isDigit(c)) {
                val += this.program[this.inc.i()];
                this.inc.inc();
                c = this.program[this.inc.i()];
                if (c === undefined) {
                    throw new Error("Unexpected end of input");
                }
            }
        }
        const end = this.inc.pos();
        return { type: 'number', val: Number(val), loc: { start, end } };
    }
    str() {
        const start = this.inc.pos();
        this.inc.inc();
        let val = '';
        while (this.inc.i() < this.program.length && this.program[this.inc.i()] !== '"') {
            val += this.program[this.inc.i()];
            this.inc.inc();
        }
        this.inc.inc();
        const end = this.inc.pos();
        return { type: 'string', val, loc: { start, end } };
    }
    twoCharSym() {
        const start = this.inc.pos();
        const c = this.program[this.inc.i()];
        const d = this.program[this.inc.i() + 1];
        this.inc.inc();
        this.inc.inc();
        const end = this.inc.pos();
        return { type: `${c}${d}`, loc: { start, end } };
    }
    oneCharSym() {
        const start = this.inc.pos();
        const c = this.program[this.inc.i()];
        this.inc.inc();
        const end = this.inc.pos();
        return { type: c, loc: { start, end } };
    }
}
const keywords = new Set(['if', 'else', 'while', 'true', 'false', 'null', 'fn', 'return']);
function isKeyword(s) {
    return keywords.has(s);
}
const alpha = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
function isAlpha(c) {
    return alpha.has(c);
}
const digit = new Set('0123456789');
function isDigit(c) {
    return digit.has(c);
}
function isAlphaNumeric(c) {
    return isAlpha(c) || isDigit(c);
}
const oneCharSyms = new Set(['(', ')', '[', ']', '{', '}', '.', ',', '+', '-', '*', '/', '%', '!', '<', '>', '=', ';', ':']);
function isOneCharSym(c) {
    return oneCharSyms.has(c);
}
const twoCharSyms = new Set(['<=', '>=', '==', '!=', '&&', '||']);
function isTwoCharSym(cd) {
    return twoCharSyms.has(cd);
}
export class TokenManager {
    constructor(tokens) {
        this.i = 0;
        this.tokens = tokens;
    }
    // returns current token without moving forward.
    peek() {
        return this.tokens[this.i];
    }
    // Consumes current token
    eat(types) {
        const currentToken = this.tokens[this.i];
        if (!currentToken) {
            throw new Error("Unexpected end of input");
        }
        if (typeof types === 'string') {
            types = [types];
        }
        if (types && types.length > 0 && !types.includes(currentToken.type)) {
            throw new Error(`Expected ${types.join(', ')} but got ${currentToken.type}`);
        }
        this.i++;
        return currentToken;
    }
}
// let p: string = `while(true){
// count=count+1;
// }`;
// let t: Tokenizer = new Tokenizer(p);
// const tokens=t.tokenize();
// console.log(JSON.stringify(tokens))
//# sourceMappingURL=tokenizer.js.map