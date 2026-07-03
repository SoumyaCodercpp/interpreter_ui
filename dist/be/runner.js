import { Heap, LexicalEnvironment, CallStack, isTruthy, isPrimitive } from "./memory.js";
import { printAny } from "./builtin.js";
export class Runner {
    constructor() {
        this.heap = new Heap();
        this.printed = [];
        // Create built-in environment with print
        const builtinEnv = new LexicalEnvironment();
        const printptr = this.heap.set({
            type: "builtinfunction",
            impl: (args) => {
                const strs = [];
                for (const argptr of args) {
                    strs.push(printAny(this.heap, this.heap.get(argptr)));
                }
                this.printed.push(strs.join(" "));
                return this.heap.set({ type: "null" });
            },
        });
        builtinEnv.set("print", printptr);
        // Create global environment (parent = builtinEnv)
        this.globalEnv = new LexicalEnvironment(builtinEnv);
        // Create call stack
        this.callStack = new CallStack();
    }
    run(program) {
        // Push global frame
        this.callStack.push("", program, this.globalEnv);
        // Execute each statement
        this.executeBlock(program);
        // Pop global frame
        this.callStack.pop();
    }
    // ─── BLOCK ─────────────────────────────────────────
    executeBlock(block) {
        for (const stmt of block.statements) {
            this.executeStatement(stmt);
        }
    }
    // ─── STATEMENTS ────────────────────────────────────
    executeStatement(stmt) {
        // Update current node for stack display
        this.callStack.peek().curr = stmt;
        switch (stmt.type) {
            case "AssignmentStatement":
                return this.executeAssignment(stmt);
            case "ExpressionStatement":
                this.evaluateExpression(stmt.expression);
                return;
            case "IfStatement":
                return this.executeIf(stmt);
            case "WhileLoop":
                return this.executeWhile(stmt);
            case "FunctionDeclaration":
                return this.executeFunctionDeclaration(stmt);
            case "ReturnStatement":
                return this.executeReturn(stmt);
            default:
                throw new Error(`Unknown statement type: ${stmt.type}`);
        }
    }
    // ─── ASSIGNMENT ────────────────────────────────────
    executeAssignment(stmt) {
        const valuePtr = this.evaluateExpression(stmt.right);
        if (stmt.left.type === "Identifier") {
            this.callStack.peek().env.set(stmt.left.name, valuePtr);
        }
        else if (stmt.left.type === "PropAccess") {
            const targetPtr = this.evaluateExpression(stmt.left.target);
            const targetVal = this.heap.get(targetPtr);
            if (targetVal.type !== "object") {
                throw new Error(`Cannot set property of ${targetVal.type}`);
            }
            targetVal.properties[stmt.left.property.name] = valuePtr;
        }
        else if (stmt.left.type === "ElementAccess") {
            const targetPtr = this.evaluateExpression(stmt.left.target);
            const indexPtr = this.evaluateExpression(stmt.left.index);
            const targetVal = this.heap.get(targetPtr);
            const indexVal = this.heap.get(indexPtr);
            if (targetVal.type === "array") {
                if (indexVal.type !== "number")
                    throw new Error("Array index must be number");
                targetVal.elements[indexVal.value] = valuePtr;
            }
            else if (targetVal.type === "object") {
                const key = indexVal.type === "string" ? indexVal.value : String(indexVal.type === "number" ? indexVal.value : "null");
                targetVal.properties[key] = valuePtr;
            }
            else {
                throw new Error(`Cannot index into ${targetVal.type}`);
            }
        }
        else {
            throw new Error(`Assignment to ${stmt.left.type} not supported`);
        }
    }
    // ─── IF STATEMENT ──────────────────────────────────
    executeIf(stmt) {
        const condPtr = this.evaluateExpression(stmt.condition);
        const condVal = this.heap.get(condPtr);
        if (isTruthy(condVal)) {
            this.executeBlock(stmt.body);
        }
        else {
            // Try else-ifs
            let executed = false;
            for (const elseIf of stmt.elseIfs) {
                const eiCondPtr = this.evaluateExpression(elseIf.condition);
                const eiCondVal = this.heap.get(eiCondPtr);
                if (isTruthy(eiCondVal)) {
                    this.executeBlock(elseIf.body);
                    executed = true;
                    break;
                }
            }
            // Else branch
            if (!executed && stmt.else) {
                this.executeBlock(stmt.else);
            }
        }
    }
    // ─── WHILE LOOP ────────────────────────────────────
    executeWhile(stmt) {
        while (true) {
            const condPtr = this.evaluateExpression(stmt.condition);
            const condVal = this.heap.get(condPtr);
            if (!isTruthy(condVal)) {
                break;
            }
            this.executeBlock(stmt.body);
        }
    }
    // ─── FUNCTION DECLARATION ──────────────────────────
    executeFunctionDeclaration(stmt) {
        const fnPtr = this.heap.set({
            type: "function",
            node: stmt,
            parentEnv: this.callStack.peek().env,
        });
        this.callStack.peek().env.set(stmt.name, fnPtr);
    }
    // ─── RETURN STATEMENT ──────────────────────────────
    executeReturn(stmt) {
        // This is handled differently - we'll use a simple throw pattern
        // For now, evaluate the expression and throw a special value
        if (stmt.expression) {
            const ptr = this.evaluateExpression(stmt.expression);
            throw { type: "RETURN", value: ptr };
        }
        throw { type: "RETURN", value: this.heap.set({ type: "null" }) };
    }
    // ─── EXPRESSIONS ───────────────────────────────────
    evaluateExpression(expr) {
        switch (expr.type) {
            case "NumberLiteral":
                return this.heap.set({ type: "number", value: expr.value });
            case "StringLiteral":
                return this.heap.set({ type: "string", value: expr.value });
            case "BooleanLiteral":
                return this.heap.set({ type: "boolean", value: expr.value });
            case "NullLiteral":
                return this.heap.set({ type: "null" });
            case "Identifier":
                return this.evaluateIdentifier(expr);
            case "BinaryExpression":
                return this.evaluateBinary(expr);
            case "UnaryExpression":
                return this.evaluateUnary(expr);
            case "ParenthesizedExpression":
                return this.evaluateExpression(expr.expression);
            case "Call":
                return this.evaluateCall(expr);
            case "ArrayLiteral":
                return this.evaluateArray(expr);
            case "ObjectLiteral":
                return this.evaluateObject(expr);
            case "PropAccess":
                return this.evaluatePropAccess(expr);
            case "ElementAccess":
                return this.evaluateElementAccess(expr);
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }
    // ─── IDENTIFIER ────────────────────────────────────
    evaluateIdentifier(expr) {
        const ptr = this.callStack.peek().env.get(expr.name);
        if (ptr === undefined) {
            throw new Error(`ReferenceError: ${expr.name} is not defined`);
        }
        return ptr;
    }
    // ─── BINARY EXPRESSION ─────────────────────────────
    evaluateBinary(expr) {
        // Short-circuit for &&
        if (expr.operator === "&&") {
            const leftPtr = this.evaluateExpression(expr.left);
            const lv = this.heap.get(leftPtr);
            if (!isTruthy(lv)) {
                return this.heap.set({ type: "boolean", value: false });
            }
            const rightPtr = this.evaluateExpression(expr.right);
            const rv = this.heap.get(rightPtr);
            return this.heap.set({ type: "boolean", value: isTruthy(rv) });
        }
        // Short-circuit for ||
        if (expr.operator === "||") {
            const leftPtr = this.evaluateExpression(expr.left);
            const lv = this.heap.get(leftPtr);
            if (isTruthy(lv)) {
                return this.heap.set({ type: "boolean", value: true });
            }
            const rightPtr = this.evaluateExpression(expr.right);
            const rv = this.heap.get(rightPtr);
            return this.heap.set({ type: "boolean", value: isTruthy(rv) });
        }
        // Normal evaluation
        const leftPtr = this.evaluateExpression(expr.left);
        const rightPtr = this.evaluateExpression(expr.right);
        const lv = this.heap.get(leftPtr);
        const rv = this.heap.get(rightPtr);
        switch (expr.operator) {
            case "+": return this.evalAdd(lv, rv);
            case "-": return this.evalArithmetic(lv, rv, (a, b) => a - b, "-");
            case "*": return this.evalArithmetic(lv, rv, (a, b) => a * b, "*");
            case "/": return this.evalArithmetic(lv, rv, (a, b) => a / b, "/");
            case "%": return this.evalArithmetic(lv, rv, (a, b) => a % b, "%");
            case ">": return this.evalComparison(lv, rv, (a, b) => a > b, ">");
            case "<": return this.evalComparison(lv, rv, (a, b) => a < b, "<");
            case ">=": return this.evalComparison(lv, rv, (a, b) => a >= b, ">=");
            case "<=": return this.evalComparison(lv, rv, (a, b) => a <= b, "<=");
            case "==": return this.evalEquality(lv, rv, leftPtr, rightPtr, false);
            case "!=": return this.evalEquality(lv, rv, leftPtr, rightPtr, true);
            default:
                throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }
    evalAdd(lv, rv) {
        if (lv.type === "number" && rv.type === "number") {
            return this.heap.set({ type: "number", value: lv.value + rv.value });
        }
        if (lv.type === "string" && rv.type === "string") {
            return this.heap.set({ type: "string", value: lv.value + rv.value });
        }
        throw new Error(`Cannot add ${lv.type} and ${rv.type}`);
    }
    evalArithmetic(lv, rv, op, name) {
        if (lv.type !== "number" || rv.type !== "number") {
            throw new Error(`Operator '${name}' requires numbers`);
        }
        return this.heap.set({ type: "number", value: op(lv.value, rv.value) });
    }
    evalComparison(lv, rv, op, name) {
        if (lv.type !== "number" || rv.type !== "number") {
            throw new Error(`Operator '${name}' requires numbers`);
        }
        return this.heap.set({ type: "boolean", value: op(lv.value, rv.value) });
    }
    evalEquality(lv, rv, leftPtr, rightPtr, isNegated) {
        if (leftPtr === rightPtr) {
            return this.heap.set({ type: "boolean", value: !isNegated });
        }
        if (isPrimitive(lv) && isPrimitive(rv)) {
            if (lv.type === "null" && rv.type === "null") {
                return this.heap.set({ type: "boolean", value: !isNegated });
            }
            if (lv.type === rv.type && lv.value === rv.value) {
                return this.heap.set({ type: "boolean", value: !isNegated });
            }
            return this.heap.set({ type: "boolean", value: isNegated });
        }
        return this.heap.set({ type: "boolean", value: isNegated });
    }
    // ─── UNARY EXPRESSION ──────────────────────────────
    evaluateUnary(expr) {
        const argPtr = this.evaluateExpression(expr.argument);
        const val = this.heap.get(argPtr);
        switch (expr.operator) {
            case "!":
                return this.heap.set({ type: "boolean", value: !isTruthy(val) });
            case "-":
                if (val.type === "number") {
                    return this.heap.set({ type: "number", value: -val.value });
                }
                throw new Error(`Cannot negate ${val.type}`);
            case "+":
                if (val.type === "number") {
                    return this.heap.set({ type: "number", value: val.value });
                }
                throw new Error(`Unary '+' requires number`);
            default:
                throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }
    // ─── FUNCTION CALL ─────────────────────────────────
    evaluateCall(expr) {
        const targetPtr = this.evaluateExpression(expr.target);
        const fnValue = this.heap.get(targetPtr);
        // Evaluate arguments
        const argPtrs = [];
        for (const arg of expr.arguments) {
            argPtrs.push(this.evaluateExpression(arg));
        }
        if (fnValue.type === "builtinfunction") {
            return fnValue.impl(argPtrs);
        }
        if (fnValue.type === "function") {
            // Create new environment
            const newEnv = new LexicalEnvironment(fnValue.parentEnv);
            // Set parameters
            fnValue.node.params.forEach((param, i) => {
                newEnv.set(param.name, argPtrs[i] ?? this.heap.set({ type: "null" }));
            });
            // Push new frame
            this.callStack.push(fnValue.node.name, fnValue.node.body, newEnv);
            let returnValue;
            try {
                this.executeBlock(fnValue.node.body);
                // No return → return null
                returnValue = this.heap.set({ type: "null" });
            }
            catch (e) {
                if (e && e.type === "RETURN") {
                    returnValue = e.value;
                }
                else {
                    throw e;
                }
            }
            // Pop frame
            this.callStack.pop();
            return returnValue;
        }
        throw new Error(`Cannot call ${fnValue.type}`);
    }
    // ─── ARRAY LITERAL ─────────────────────────────────
    evaluateArray(expr) {
        const elements = [];
        for (const elem of expr.elements) {
            elements.push(this.evaluateExpression(elem));
        }
        return this.heap.set({ type: "array", elements });
    }
    // ─── OBJECT LITERAL ────────────────────────────────
    evaluateObject(expr) {
        const properties = {};
        for (const [key, value] of expr.pairs) {
            let keyStr;
            if (key.type === "IdentifierKey") {
                keyStr = key.identifier.name;
            }
            else {
                const keyPtr = this.evaluateExpression(key.expression);
                const keyVal = this.heap.get(keyPtr);
                if (!isPrimitive(keyVal)) {
                    throw new Error(`Object key must be primitive`);
                }
                keyStr = keyVal.type === "string" ? keyVal.value : String(keyVal.type === "number" ? keyVal.value : "null");
            }
            const valuePtr = this.evaluateExpression(value);
            properties[keyStr] = valuePtr;
        }
        return this.heap.set({ type: "object", properties });
    }
    // ─── PROPERTY ACCESS ───────────────────────────────
    evaluatePropAccess(expr) {
        const targetPtr = this.evaluateExpression(expr.target);
        const targetVal = this.heap.get(targetPtr);
        if (targetVal.type !== "object") {
            throw new Error(`Cannot access property of ${targetVal.type}`);
        }
        const propPtr = targetVal.properties[expr.property.name];
        return propPtr ?? this.heap.set({ type: "null" });
    }
    // ─── ELEMENT ACCESS ────────────────────────────────
    evaluateElementAccess(expr) {
        const targetPtr = this.evaluateExpression(expr.target);
        const indexPtr = this.evaluateExpression(expr.index);
        const targetVal = this.heap.get(targetPtr);
        const indexVal = this.heap.get(indexPtr);
        if (targetVal.type === "array") {
            if (indexVal.type !== "number") {
                throw new Error(`Array index must be number`);
            }
            return targetVal.elements[indexVal.value] ?? this.heap.set({ type: "null" });
        }
        if (targetVal.type === "object") {
            if (!isPrimitive(indexVal)) {
                throw new Error(`Object key must be primitive`);
            }
            const key = indexVal.type === "string" ? indexVal.value : String(indexVal.type === "number" ? indexVal.value : "null");
            return targetVal.properties[key] ?? this.heap.set({ type: "null" });
        }
        throw new Error(`Cannot index into ${targetVal.type}`);
    }
}
//# sourceMappingURL=runner.js.map