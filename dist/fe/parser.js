import { uuid } from "../be/utils.js";
function isPrimitiveLookahead(token) {
    return token.type === 'number'
        || token.type === 'string'
        || token.type === 'true'
        || token.type === 'false'
        || token.type === 'null'
        || token.type === 'identifier';
}
/*
123
"hello"
true
false
null
count
*/
function isKVPairLookahead(token) {
    return isPrimitiveLookahead(token) || token.type === '[';
}
function isAtomLookahead(token) {
    return isPrimitiveLookahead(token)
        || token.type === '('
        || token.type === '['
        || token.type === '{';
}
/*
5
x
(5+3)
[]
{}
*/
function isUnaryExpressionLookahead(token) {
    return token.type === '!' || token.type === '-' || token.type === '+';
}
/*
!x
-x
+x
*/
function isExpressionLookahead(token) {
    return isAtomLookahead(token) || isUnaryExpressionLookahead(token);
}
function isReturnStatementLookahead(token) {
    return token.type === 'return';
}
function isFunctionDeclarationLookahead(token) {
    return token.type === 'fn';
}
function isWhileLoopLookahead(token) {
    return token.type === 'while';
}
function isIfStatementLookahead(token) {
    return token.type === 'if';
}
function isStatementLookahead(token) {
    return isWhileLoopLookahead(token)
        || isIfStatementLookahead(token)
        || isReturnStatementLookahead(token)
        || isFunctionDeclarationLookahead(token)
        || isExpressionLookahead(token);
}
// Parser- tokens to AST
export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
    }
    /*
    Block -> Statement*
    */
    block() {
        const statements = [];
        while (isStatementLookahead(this.tokens.peek())) {
            statements.push(this.statement());
        }
        const loc = statements.length > 0 ? {
            start: statements[0].loc.start,
            end: statements[statements.length - 1].loc.end
        } : this.tokens.peek().loc;
        return {
            id: uuid(),
            type: 'Block',
            statements,
            loc
        };
    }
    statement() {
        const token = this.tokens.peek();
        if (isWhileLoopLookahead(token)) {
            return this.whileLoop();
        }
        if (isIfStatementLookahead(token)) {
            return this.ifStatement();
        }
        if (isFunctionDeclarationLookahead(token)) {
            return this.functionDeclaration();
        }
        if (isReturnStatementLookahead(token)) {
            return this.returnStatement();
        }
        if (isExpressionLookahead(token)) {
            return this.assignmentOrExpressionStatement();
        }
        throw new Error(`Unexpected token: ${token.type}`);
    }
    /*
    x = 5;
    foo();
    */
    assignmentOrExpressionStatement() {
        const left = this.expression();
        if (this.tokens.peek().type === '=') {
            this.tokens.eat('=');
            const right = this.expression();
            const { end } = this.tokens.eat(';').loc;
            return {
                id: uuid(),
                type: 'AssignmentStatement',
                left,
                right,
                loc: { start: left.loc.start, end }
            };
        }
        const { end } = this.tokens.eat(';').loc;
        return {
            id: uuid(),
            type: 'ExpressionStatement',
            expression: left,
            loc: { start: left.loc.start, end }
        };
    }
    ifStatement() {
        const { start } = this.tokens.eat('if').loc;
        this.tokens.eat('(');
        const condition = this.expression();
        this.tokens.eat(')');
        this.tokens.eat('{');
        const body = this.block();
        let { end } = this.tokens.eat('}').loc;
        const elseIfs = [];
        let elseBranch;
        while (this.tokens.peek().type === 'else') {
            this.tokens.eat('else');
            if (this.tokens.peek().type === 'if') {
                this.tokens.eat('if');
                this.tokens.eat('(');
                const elseIfCondition = this.expression();
                this.tokens.eat(')');
                this.tokens.eat('{');
                const elseIfBody = this.block();
                end = this.tokens.eat('}').loc.end;
                elseIfs.push({
                    condition: elseIfCondition,
                    body: elseIfBody
                });
            }
            else {
                this.tokens.eat('{');
                elseBranch = this.block();
                end = this.tokens.eat('}').loc.end;
                break;
            }
        }
        return {
            id: uuid(),
            type: 'IfStatement',
            condition,
            body,
            elseIfs,
            else: elseBranch,
            loc: { start, end }
        };
    }
    whileLoop() {
        const { start } = this.tokens.eat('while').loc;
        this.tokens.eat('(');
        const condition = this.expression();
        this.tokens.eat(')');
        this.tokens.eat('{');
        const body = this.block();
        const { end } = this.tokens.eat('}').loc;
        return {
            id: uuid(),
            type: 'WhileLoop',
            condition,
            body,
            loc: { start, end }
        };
    }
    expression() {
        return this.orExpression();
    }
    /*
  
      These functions implement precedence.
      Higher function = lower precedence.
  
      orExpression           ||
      andExpression          &&
      equalityExpression     == !=
      relationalExpression   < > <= >=
      additiveExpression     + -
      multiplicativeExpression * / %
      unaryExpression        ! - +
      atom
  
    */
    /*
      1 + 2 * 3
    
      +
    ├──1
    └──*
       ├──2
       └──3
    
    */
    orExpression() {
        let left = this.andExpression();
        while (this.tokens.peek().type === '||') {
            this.tokens.eat('||');
            const right = this.andExpression();
            left = {
                id: uuid(),
                type: 'BinaryExpression',
                left,
                operator: '||',
                right,
                loc: {
                    start: left.loc.start,
                    end: right.loc.end
                }
            };
        }
        // Left associative.
        return left;
    }
    andExpression() {
        let left = this.equalityExpression();
        while (this.tokens.peek().type === '&&') {
            this.tokens.eat('&&');
            const right = this.equalityExpression();
            left = {
                id: uuid(),
                type: 'BinaryExpression',
                left,
                operator: '&&',
                right,
                loc: {
                    start: left.loc.start,
                    end: right.loc.end
                }
            };
        }
        return left;
    }
    equalityExpression() {
        let left = this.relationalExpression();
        while (this.tokens.peek().type === '==' || this.tokens.peek().type === '!=') {
            const operator = this.tokens.eat(['==', '!=']).type;
            const right = this.relationalExpression();
            left = {
                id: uuid(),
                type: 'BinaryExpression',
                left,
                operator,
                right,
                loc: {
                    start: left.loc.start,
                    end: right.loc.end
                }
            };
        }
        return left;
    }
    relationalExpression() {
        let left = this.additiveExpression();
        while (this.tokens.peek().type === '<=' ||
            this.tokens.peek().type === '>=' ||
            this.tokens.peek().type === '<' ||
            this.tokens.peek().type === '>') {
            const operator = this.tokens.eat(['<=', '>=', '<', '>']).type;
            const right = this.additiveExpression();
            left = {
                id: uuid(),
                type: 'BinaryExpression',
                left,
                operator,
                right,
                loc: {
                    start: left.loc.start,
                    end: right.loc.end
                }
            };
        }
        return left;
    }
    additiveExpression() {
        let left = this.multiplicativeExpression();
        while (this.tokens.peek().type === '+' ||
            this.tokens.peek().type === '-') {
            const operator = this.tokens.eat(['+', '-']).type;
            const right = this.multiplicativeExpression();
            left = {
                id: uuid(),
                type: 'BinaryExpression',
                left,
                operator,
                right,
                loc: {
                    start: left.loc.start,
                    end: right.loc.end
                }
            };
        }
        return left;
    }
    multiplicativeExpression() {
        let left = this.unaryExpression();
        while (this.tokens.peek().type === '*' ||
            this.tokens.peek().type === '/' ||
            this.tokens.peek().type === '%') {
            const operator = this.tokens.eat(['*', '/', '%']).type;
            const right = this.unaryExpression();
            left = {
                id: uuid(),
                type: 'BinaryExpression',
                left,
                operator,
                right,
                loc: {
                    start: left.loc.start,
                    end: right.loc.end
                }
            };
        }
        return left;
    }
    unaryExpression() {
        const token = this.tokens.peek();
        if (isUnaryExpressionLookahead(token)) {
            const operator = this.tokens.eat(['!', '-', '+']).type;
            const argument = this.unaryExpression();
            return {
                id: uuid(),
                type: 'UnaryExpression',
                operator,
                argument,
                loc: {
                    start: token.loc.start,
                    end: argument.loc.end
                }
            };
        }
        return this.accessOrCallExpression();
    }
    /*
    int x = - arr[0]
  
    unary -> (unary)*AccessorCall
    
    */
    accessOrCallExpression() {
        let left = this.atom(); //to handle the primitive name of fucntion call or element/property access
        while (true) {
            const token = this.tokens.peek();
            if (token.type === '.') {
                this.tokens.eat('.');
                const property = this.tokens.eat('identifier');
                left = {
                    id: uuid(),
                    type: 'PropAccess',
                    target: left,
                    property: {
                        id: uuid(),
                        type: 'Identifier',
                        name: property.val,
                        loc: property.loc
                    },
                    loc: {
                        start: left.loc.start,
                        end: property.loc.end
                    }
                };
            }
            else if (token.type === '[') {
                this.tokens.eat('[');
                const index = this.expression();
                const { end } = this.tokens.eat(']').loc;
                left = {
                    id: uuid(),
                    type: 'ElementAccess',
                    target: left,
                    index,
                    loc: {
                        start: left.loc.start,
                        end
                    }
                };
            }
            else if (token.type === '(') {
                this.tokens.eat('(');
                const args = isExpressionLookahead(this.tokens.peek()) ? this.exprList() : [];
                const { end } = this.tokens.eat(')').loc;
                left = {
                    id: uuid(),
                    type: 'Call',
                    target: left,
                    arguments: args,
                    loc: {
                        start: left.loc.start,
                        end
                    }
                };
            }
            else {
                break;
            }
        }
        return left;
    }
    primitive() {
        const token = this.tokens.peek();
        if (token.type === 'true') {
            this.tokens.eat('true');
            return {
                id: uuid(),
                type: 'BooleanLiteral',
                value: true,
                loc: token.loc
            };
        }
        if (token.type === 'false') {
            this.tokens.eat('false');
            return {
                id: uuid(),
                type: 'BooleanLiteral',
                value: false,
                loc: token.loc
            };
        }
        if (token.type === 'null') {
            this.tokens.eat('null');
            return {
                id: uuid(),
                type: 'NullLiteral',
                loc: token.loc
            };
        }
        if (token.type === 'number') {
            this.tokens.eat('number');
            return {
                id: uuid(),
                type: 'NumberLiteral',
                value: token.val,
                loc: token.loc
            };
        }
        if (token.type === 'string') {
            this.tokens.eat('string');
            return {
                id: uuid(),
                type: 'StringLiteral',
                value: token.val,
                loc: token.loc
            };
        }
        if (token.type === 'identifier') {
            this.tokens.eat('identifier');
            return {
                id: uuid(),
                type: 'Identifier',
                name: token.val,
                loc: token.loc
            };
        }
        throw new Error(`Unexpected token: ${token.type}`);
    }
    atom() {
        const token = this.tokens.peek();
        if (isPrimitiveLookahead(token)) { //arr in arr[0] or add in add(1,2)
            return this.primitive();
        }
        if (token.type === '(') {
            return this.parenthesizedExpression();
        }
        if (token.type === '[') {
            return this.arrayLiteral();
        }
        if (token.type === '{') {
            return this.objectLiteral();
        }
        throw new Error(`Unexpected token: ${token.type}`);
    }
    parenthesizedExpression() {
        const { start } = this.tokens.eat('(').loc;
        const expression = this.expression();
        const { end } = this.tokens.eat(')').loc;
        return {
            id: uuid(),
            type: 'ParenthesizedExpression',
            expression,
            loc: { start, end }
        };
    }
    arrayLiteral() {
        const { start } = this.tokens.eat('[').loc;
        const elements = isExpressionLookahead(this.tokens.peek()) ? this.exprList() : [];
        const { end } = this.tokens.eat(']').loc;
        return {
            id: uuid(),
            type: 'ArrayLiteral',
            elements,
            loc: { start, end }
        };
    }
    exprList() {
        // add(1,2,3)
        const first = this.expression(); // first=1
        const expressions = [first];
        while (this.tokens.peek().type === ',') {
            this.tokens.eat(',');
            if (isExpressionLookahead(this.tokens.peek())) {
                expressions.push(this.expression()); //2 then 3 and so o..
            }
        }
        return expressions;
    }
    objectLiteral() {
        const { start } = this.tokens.eat('{').loc;
        const pairs = isKVPairLookahead(this.tokens.peek()) ? this.kvpairs() : [];
        const { end } = this.tokens.eat('}').loc;
        return {
            id: uuid(),
            type: 'ObjectLiteral',
            pairs,
            loc: { start, end }
        };
    }
    kvpairs() {
        const first = this.kvpair();
        const pairs = [first];
        while (this.tokens.peek().type === ',') {
            this.tokens.eat(',');
            if (isKVPairLookahead(this.tokens.peek())) {
                pairs.push(this.kvpair());
            }
        }
        return pairs;
    }
    /*
    {
    object has 3 tuples
  
    name: "John", ---> idetifier key
    123: "abc",   ---> expression
    [x + y]: 10   --->expresson key
  
  }
    */
    kvpair() {
        let key;
        //cheking the key
        if (this.tokens.peek().type === '[') {
            this.tokens.eat('[');
            key = {
                type: 'ExpressionKey', //[x+y]
                expression: this.expression()
            };
            this.tokens.eat(']');
        }
        else {
            const prim = this.primitive();
            if (prim.type === 'Identifier') {
                key = {
                    type: 'IdentifierKey',
                    identifier: prim
                };
            }
            else {
                key = {
                    type: 'ExpressionKey',
                    expression: prim
                };
            }
        }
        this.tokens.eat(':');
        const value = this.expression();
        return [key, value]; //tuples
    }
    functionDeclaration() {
        const { start } = this.tokens.eat('fn').loc;
        const name = this.tokens.eat('identifier').val;
        this.tokens.eat('(');
        const params = this.tokens.peek().type === 'identifier' ? this.params() : [];
        this.tokens.eat(')');
        this.tokens.eat('{');
        const body = this.block();
        const { end } = this.tokens.eat('}').loc;
        return {
            id: uuid(),
            type: 'FunctionDeclaration',
            name,
            params,
            body,
            loc: { start, end }
        };
    }
    params() {
        const first = this.tokens.eat('identifier');
        //each of these are an idetifier , can't write like [first]
        const identifiers = [{
                id: uuid(),
                type: 'Identifier',
                name: first.val,
                loc: first.loc
            }];
        while (this.tokens.peek().type === ',') {
            this.tokens.eat(',');
            if (this.tokens.peek().type === 'identifier') {
                const next = this.tokens.eat('identifier');
                identifiers.push({
                    id: uuid(),
                    type: 'Identifier',
                    name: next.val,
                    loc: next.loc
                });
            }
        }
        return identifiers;
    }
    // return 5;
    // return ;
    returnStatement() {
        const { start } = this.tokens.eat('return').loc;
        let expression;
        if (isExpressionLookahead(this.tokens.peek())) {
            expression = this.expression();
        }
        const { end } = this.tokens.eat(';').loc;
        return {
            id: uuid(),
            type: 'ReturnStatement',
            expression,
            loc: { start, end }
        };
    }
    parse() {
        const program = this.block();
        this.tokens.eat('EOF');
        return program;
    }
}
//# sourceMappingURL=parser.js.map