import { type Location } from "./tokenizer.js"

export type AstNodeId = string //type alias
interface BaseNode {
  id: AstNodeId
  loc: Location
}

export interface Block extends BaseNode {
  type: 'Block'
  statements: Statement[] //multiple statements
}

//HERE ALL INTERFACES ACTS AS NODES OF AST

export type Statement = IfStatement // if (...)
  | WhileLoop //while (...)
  | FunctionDeclaration
  | ReturnStatement //return x;
  | AssignmentStatement //x = 5;
  | ExpressionStatement //foo();

export interface IfStatement extends BaseNode {
  type: 'IfStatement'
  condition: Expression
  body: Block
  elseIfs: ElseIf[]
  else?: Block
}
/*
if (x > 5) {
   print(x);
}
   IfStatement
├── condition
│   └── BinaryExpression
└── body
    └── Block
*/ 

export interface ElseIf {
  condition: Expression
  body: Block
}

export interface WhileLoop extends BaseNode {
  type: 'WhileLoop'
  condition: Expression
  body: Block
}
/*
while (x < 10) {
   x = x + 1;
}
   WhileLoop
├── condition
└── body
*/

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration'
  name: string
  params: Identifier[]
  body: Block
}
/*
fn add(a, b) {
   return a + b;
}
name: "add"
params: [a, b]
body: Block

*/ 

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement'
  expression?: Expression
}
/*
return 5;
return; (expression optional)
*/

export interface AssignmentStatement extends BaseNode {
  type: 'AssignmentStatement'
  left: Expression
  right: Expression
}
/*
x = 5;
Assignment
├── left
│   └── Identifier(x)
└── right
    └── NumberLiteral(5)
*/

// A function call used as a statement.
// add(1,2);
export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement'
  expression: Expression
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression'
  left: Expression
  operator: '+' | '-' | '*' | '/' | '%' | '>' | '<' | '>=' | '<=' | '==' | '!=' | '&&' | '||'
  right: Expression
}
/*
5 + 3
BinaryExpression(+)
├── 5
└── 3
*/ 

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression'
  operator: '!' | '-' | '+'
  argument: Expression
}
/*
    !flag
    -x
    +y

    UnaryExpression(!)
    └── Identifier(flag)
    */ 

export interface PropAccess extends BaseNode {
  type: 'PropAccess'
  target: Expression
  property: Identifier
}
/*
    users[0].name
    PropAccess
    ├── users[0]
    └── name
*/ 

export interface ElementAccess extends BaseNode {
  type: 'ElementAccess'
  target: Expression
  index: Expression
}

/*
    arr[0];

    ElementAccess
    ├── arr
    └── 0
*/ 


export interface Call extends BaseNode {
  type: 'Call'
  target: Expression
  arguments: Expression[]
}

/*
add(1, 2)
Call
├── add
├── 1
└── 2
*/ 

/*
user.getName()

Call
├── callee
│   └── PropAccess
│       ├── target: Identifier("user")
│       └── property: Identifier("getName")
└── arguments: []

*/
type Access = PropAccess | ElementAccess
type AccessOrCall = Access | Call

export interface BooleanLiteral extends BaseNode {
  type: 'BooleanLiteral'
  value: boolean
}

export interface Identifier extends BaseNode {
  type: 'Identifier'
  name: string
}

export interface NumberLiteral extends BaseNode {
  type: 'NumberLiteral'
  value: number
}

export interface StringLiteral extends BaseNode {
  type: 'StringLiteral'
  value: string
}

export interface NullLiteral extends BaseNode {
  type: 'NullLiteral'
}
//null

export interface PrintKeyword extends BaseNode {
  type: 'PrintKeyword'
  name: string
}

//primitives are the simplest expressions.
export type Primitive = NullLiteral
  | BooleanLiteral
  | StringLiteral
  | NumberLiteral
  | Identifier

// imp for precedence
export interface ParenthesizedExpression extends BaseNode {
  type: 'ParenthesizedExpression'
  expression: Expression
}

export interface ArrayLiteral extends BaseNode {
  type: 'ArrayLiteral'
  elements: Expression[]
}
/*
[1,2,3]
ArrayLiteral
├── 1
├── 2
└── 3
*/ 

export interface ExpressionKey {
  type: 'ExpressionKey'
  expression: Expression
}

export interface IdentifierKey {
  type: 'IdentifierKey'
  identifier: Identifier
}

type Key = ExpressionKey | IdentifierKey
/* 
    key can be an expression
    map[i+j]=a;
    i+j->key
    a->value
*/ 

//tuple
export type KVPair = [Key, Expression]
export interface ObjectLiteral extends BaseNode {
  type: 'ObjectLiteral'
  pairs: KVPair[]
}
/*
{
  name: "John"
}
{
  [x + y]: 10
}
*/ 


export type RefType = ArrayLiteral | ObjectLiteral



export type Atom = Primitive
  | ParenthesizedExpression
  | RefType
  | PrintKeyword

/*
    An atom is the smallest complete expression.
    5
    x
    "hello"
    []
    {}
    (5+3)
*/

export type Expression = Atom
  | BinaryExpression
  | UnaryExpression
  | AccessOrCall

/*
    5
    x
    x + y
    !flag
    foo()
    obj.name
    arr[0]
*/


export type ASTNode = Block | Statement | Expression

/*every node in the AST must be either of 3 */