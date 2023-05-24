"use strict";

import { Visibility } from "./lib/Visibility.js";
import { Token, Types } from "./tokens.js";
import { Value } from "./values.js";
import Position from "./position.js";

/**
 * @classdesc A node in the program.
 */
export class CustomNode {
    public pos_start: Position;
    public pos_end: Position;

    constructor(pos_start: Position, pos_end: Position) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    /**
     * Sets the position of the node in the code.
     * @param pos_start The starting position of the node.
     * @param pos_end The end position of the node.
     */
    public set_pos(pos_start: Position, pos_end: Position): this {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        return this;
    }
}

export class NumberNode extends CustomNode {
    public readonly value: number;

    /**
     * @param token The value of that node, which value must be a number.
     */
    constructor(token: Token<number>) {
        super(token.pos_start, token.pos_end);
        this.value = token.value;
    }

    public toString() {
        return `${this.value}`;
    }
}

export class AddNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}+${this.node_b})`;
    }
}

export class SubtractNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}-${this.node_b})`;
    }
}

export class MultiplyNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}*${this.node_b})`;
    }
}

export class DivideNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}/${this.node_b})`;
    }
}

// Unary operations
// like -5 or +5

export class PlusNode extends CustomNode {
    public readonly node: CustomNode;

    /**
     * @param node The node.
     */
    constructor(node: CustomNode) {
        super(node.pos_start, node.pos_end);
        this.node = node;
    }

    public toString() {
        return `(+${this.node})`;
    }
}

export class MinusNode extends CustomNode {
    public readonly node: CustomNode;

    /**
     * @param node The node.
     */
    constructor(node: CustomNode) {
        super(node.pos_start, node.pos_end);
        this.node = node;
    }

    public toString() {
        return `(-${this.node})`;
    }
}

export class BinaryNotNode extends CustomNode {
    public readonly node: CustomNode;

    /**
     * @param node The node.
     */
    constructor(node: CustomNode) {
        super(node.pos_start, node.pos_end);
        this.node = node;
    }

    public toString() {
        return `(~${this.node})`;
    }
}

export class PrefixOperationNode extends CustomNode {
    public readonly node: CustomNode;
    public readonly difference: number;

    /**
     * @param node The node.
     * @param difference How many times there is the incrementation token? < 0 for decrementation.
     */
    constructor(node: CustomNode, difference: number) {
        super(node.pos_start, node.pos_end);
        this.node = node;
        this.difference = difference;
    }

    public toString() {
        if (this.difference < 0) {
            return `(${'--'.repeat(Math.abs(this.difference))}${this.node})`;
        } else {
            return `(${'++'.repeat(this.difference)}${this.node})`;
        }
    }
}

export class PostfixOperationNode extends CustomNode {
    public readonly node: CustomNode;
    public readonly difference: number;
    
    /**
     * @param node The node.
     * @param difference How many times there is the incrementation token? < 0 for decrementation
     */
    constructor(node: CustomNode, difference: number) {
        super(node.pos_start, node.pos_end);
        this.node = node;
        this.difference = difference;
    }

    public toString() {
        if (this.difference < 0) {
            return `(${this.node}${'--'.repeat(Math.abs(this.difference))})`;
        } else {
            return `(${this.node}${'++'.repeat(this.difference)})`;
        }
    }
}

export class PowerNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}**${this.node_b})`;
    }
}

export class ModuloNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}%${this.node_b})`;
    }
}

export class BinaryShiftLeftNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}<<${this.node_b})`;
    }
}

export class BinaryShiftRightNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}>>${this.node_b})`;
    }
}

export class UnsignedBinaryShiftRightNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}>>>${this.node_b})`;
    }
}

export class LogicalAndNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}&${this.node_b})`;
    }
}

export class LogicalOrNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}|${this.node_b})`;
    }
}

export class LogicalXORNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a}^${this.node_b})`;
    }
}

/**
 * @classdesc Creates a variable by saving its name, its value and its type.
 */
export class VarAssignNode extends CustomNode {
    public readonly var_name_tok: Token;
    public readonly value_node: CustomNode;
    public readonly type: string;

    /**
     * @param var_name_tok The name of the variable.
     * @param value_node The value of the variable.
     * @param type The type of variable (by default "ANY")
     */
    constructor(var_name_tok: Token, value_node: CustomNode, type: string) {
        super(var_name_tok.pos_start, value_node.pos_end);
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.type = type;
    }

    public toString() {
        return `(var ${this.var_name_tok.value}${this.type && this.type !== Types.ANY ? ': ' + this.type : ''} = ${this.value_node})`;
    }
}

/**
 * @classdesc A nullish coalescing operator
 */
export class NullishOperatorNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The value of the wanted value.
     * @param node_b The value of the default value.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }
    
    public toString() {
        return `(${this.node_a} ?? ${this.node_b})`;
    }
}

/**
 * @classdesc A nullish assignment (??=)
 */
export class NullishAssignmentNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The value of the wanted value.
     * @param node_b The value of the default value.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }
    
    public toString() {
        return `(${this.node_a} ??= ${this.node_b})`;
    }
}

/**
 * @classdesc An and assignment (&&=)
 */
export class AndAssignmentNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The value of the wanted value.
     * @param node_b The value of the default value.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }
    
    public toString() {
        return `(${this.node_a} &&= ${this.node_b})`;
    }
}

/**
 * @classdesc An or assignment (||=)
 */
export class OrAssignmentNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The value of the wanted value.
     * @param node_b The value of the default value.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }
    
    public toString() {
        return `(${this.node_a} ||= ${this.node_b})`;
    }
}

/**
 * @classdesc Allows our program to access existing variables.
 */
export class VarAccessNode extends CustomNode {
    public readonly var_name_tok: Token;

    /**
     * @param var_name_tok The token that represents a variable.
     */
    constructor(var_name_tok: Token) {
        super(var_name_tok.pos_start, var_name_tok.pos_end);
        this.var_name_tok = var_name_tok;
    }

    public toString() {
        return `(${this.var_name_tok.value})`;
    }
}

/**
 * @classdesc Allows our program to access existing variables.
 */
export class VarModifyNode extends CustomNode {
    public readonly var_name_tok: Token;
    public readonly value_node: CustomNode;

    /**
     * @param var_name_tok The token that represents a variable.
     * @param value_node The value of the variable.
     */
    constructor(var_name_tok: Token, value_node: CustomNode) {
        super(var_name_tok.pos_start, var_name_tok.pos_end);
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
    }

    public toString() {
        return `(${this.var_name_tok.value} = ${this.value_node})`;
    }
}

export class AndNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} and ${this.node_b})`;
    }
}

export class OrNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} or ${this.node_b})`;
    }
}

export class NotNode extends CustomNode {
    public readonly node: CustomNode;
    
    /**
     * @param node The node.
     */
    constructor(node: CustomNode) {
        super(node.pos_start, node.pos_end);
        this.node = node;
    }

    public toString() {
        return `(not ${this.node})`;
    }
}

export class NotEqualsNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} != ${this.node_b})`;
    }
}

export class EqualsNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} == ${this.node_b})`;
    }
}

export class LessThanNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} < ${this.node_b})`;
    }
}

export class LessThanOrEqualNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} <= ${this.node_b})`;
    }
}

export class GreaterThanNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} > ${this.node_b})`;
    }
}

export class GreaterThanOrEqualNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly node_b: CustomNode;

    /**
     * @param node_a The left node.
     * @param node_b The right node.
     */
    constructor(node_a: CustomNode, node_b: CustomNode) {
        super(node_a.pos_start, node_b.pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `(${this.node_a} >= ${this.node_b})`;
    }
}

export class ListNode extends CustomNode {
    public readonly element_nodes: CustomNode[];

    /**
     * @param element_nodes The token that represents a string.
     * @param pos_start The starting position of the list (we must have it from the constructor because of empty lists).
     * @param pos_end The end position of the list (we must have it from the constructor because of empty lists).
     */
    constructor(element_nodes: CustomNode[], pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.element_nodes = element_nodes;
    }

    public toString() {
        return `[${this.element_nodes.join(', ')}]`;
    }
}

export class DictionaryElementNode extends CustomNode {
    public readonly key: StringNode;
    public readonly value: CustomNode;

    /**
     * @param key The key of the element.
     * @param value The value of that element.
     */
    constructor(key: StringNode, value: CustomNode) {
        super(key.pos_start, value.pos_end);
        this.key = key;
        this.value = value;
    }

    public toString() {
        return `(${this.key}: ${this.value})`;
    }
}

export class DictionaryNode extends CustomNode {
    public readonly element_nodes: DictionaryElementNode[];

    /**
     * @param element_nodes The token that represents a string.
     * @param pos_start The starting position of the list (we must have it from the constructor because of empty lists).
     * @param pos_end The end position of the list (we must have it from the constructor because of empty lists).
     */
    constructor(element_nodes: DictionaryElementNode[], pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.element_nodes = element_nodes;
    }

    public toString() {
        return `{${this.element_nodes.join(', ')}}`;
    }
}

export class ListAccessNode extends CustomNode {
    public readonly node_to_access: CustomNode;
    public readonly depth: number;
    public readonly list_nodes: ListArgumentNode[];

    /**
     * @param node_to_access The token that represents a variable.
     * @param depth The depth of the array.
     * @param list_nodes The expressions between the brackets.
     */
    constructor(node_to_access: CustomNode, depth: number, list_nodes: ListArgumentNode[]) {
        super(node_to_access.pos_start, node_to_access.pos_end);
        this.node_to_access = node_to_access;
        this.depth = depth;
        this.list_nodes = list_nodes;
    }

    public toString() {
        return `(${this.node_to_access}[expr])`;
    }
}

export class ListAssignmentNode extends CustomNode {
    public readonly accessor: ListAccessNode;
    public readonly new_value_node: CustomNode;
    
    /**
     * @param accessor The access node of the list.
     * @param new_value_node The new value.
     */
    constructor(accessor: ListAccessNode, new_value_node: CustomNode) {
        super(accessor.pos_start, accessor.pos_end);
        this.accessor = accessor;
        this.new_value_node = new_value_node;
    }

    public toString() {
        return `(${this.accessor.node_to_access}[...] = ${this.new_value_node})`;
    }
}

export class ListPushBracketsNode extends CustomNode {
    public value: number;

    /**
     * @param pos_start The starting position
     * @param pos_end The end position
     */
    constructor(pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.value = 0;
    }

    public toString() {
        return `(list[])`;
    }
}

export class ListArgumentNode extends CustomNode {
    public readonly node: CustomNode;
    public readonly is_optional: boolean;

    /**
     * @param node The expression inside the brackets ([expr])
     * @param is_optional Is the optional chaining operator present? (list[42]?.[42])
     */
    constructor(node: CustomNode, is_optional: boolean = false) {
        super(node.pos_start, node.pos_end);
        this.node = node;
        this.is_optional = is_optional;
    }

    public toString() {
        return `${this.is_optional ? '?.' : ''}[${this.node}]`;
    }
}

export class ListBinarySelector extends CustomNode {
    public readonly node_a: CustomNode | null;
    public readonly node_b: CustomNode | null;

    /**
     * @param node_a The beginning of the getter.
     * @param node_b The end of the getter.
     * @param pos_start The starting position of the binary selector.
     * @param pos_end The end position of the binary selector.
     */
    constructor(node_a: CustomNode | null, node_b: CustomNode | null, pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.node_a = node_a;
        this.node_b = node_b;
    }

    public toString() {
        return `([${this.node_a ? this.node_a : ''}:${this.node_b ? this.node_b : ''}])`;
    }
}

/**
 * @classdesc This node represents a string while reading the tokens.
 */
export class StringNode extends CustomNode {
    public readonly token: Token;
    public readonly allow_concatenation: boolean;

    /**
     * @param token The token that represents a string.
     */
    constructor(token: Token<string>) {
        super(token.pos_start, token.pos_end);
        this.token = token;
        this.allow_concatenation = this.token.data!.allow_concatenation;
    }

    public toString() {
        return `${this.token}`;
    }
}

export class IfNode extends CustomNode {
    public readonly should_return_null: boolean;
    public readonly prevent_null_return: boolean;
    public else_case: CustomNode | null;
    public cases: [CustomNode, CustomNode][];

    /**
     * @param cases The cases [[condition, expr]].
     * @param else_case The else case.
     * @param should_return_null Should return null? False for inline loops.
     * @param prevent_null_return Prevents the condition from returning "none" in an HTML structure.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(cases: [CustomNode, CustomNode][], else_case: CustomNode | null, should_return_null: boolean, prevent_null_return: boolean, pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.cases = cases;
        this.else_case = else_case;
        this.should_return_null = should_return_null;
        this.prevent_null_return = prevent_null_return;
    }

    public toString() {
        return `IfNode(${this.cases.length} cases)`;
    }
}

export class ForNode extends CustomNode {
    public readonly var_name_tok: Token;
    public readonly start_value_node: CustomNode | null;
    public readonly end_value_node: CustomNode;
    public readonly step_value_node: CustomNode | null;
    public readonly body_node: CustomNode;
    public readonly should_return_null: boolean;
    public readonly prevent_null_return: boolean;

    /**
     * @param var_name_tok The name of the variable in the for statement (i).
     * @param start_value_node The starting value, which must be 0 if not specified.
     * @param end_value_node The value it will go up to.
     * @param step_value_node The step between each iteration, which should be 1 if not specified.
     * @param body_node What gets evaluated on every iteration.
     * @param should_return_null Should return null? False for inline loops.
     * @param prevent_null_return Prevents the loop from returning "none" in an HTML structure.
     */
    constructor(var_name_tok: Token, start_value_node: CustomNode | null, end_value_node: CustomNode, step_value_node: CustomNode | null, body_node: CustomNode, should_return_null: boolean, prevent_null_return: boolean) {
        super(var_name_tok.pos_start, body_node.pos_end);
        this.var_name_tok = var_name_tok;
        this.start_value_node = start_value_node;
        this.end_value_node = end_value_node;
        this.step_value_node = step_value_node;
        this.body_node = body_node;
        this.should_return_null = should_return_null;
        this.prevent_null_return = prevent_null_return;
    }

    public toString() {
        return `ForNode`;
    }
}

export class ForeachNode extends CustomNode {
    public readonly list_node: CustomNode;
    public readonly key_name_tok: Token | null;
    public readonly value_name_tok: Token;
    public readonly body_node: CustomNode;
    public readonly should_return_null: boolean;
    public readonly prevent_null_return: boolean;

    /**
     * @param list_node The list on which we want to loop.
     * @param key_name_tok The variable that will get the name of the key as value. This will be the index if we loop on a list.
     * @param value_name_tok The variable that will be the value
     * @param body_node The body of the foreach statement.
     * @param should_return_null Should return null? `true` for a multiline statement.
     * @param prevent_null_return Prevents the loop from returning "none" in an HTML structure.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(list_node: CustomNode, key_name_tok: Token | null, value_name_tok: Token, body_node: CustomNode, should_return_null: boolean, prevent_null_return: boolean, pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.list_node = list_node;
        this.key_name_tok = key_name_tok;
        this.value_name_tok = value_name_tok;
        this.body_node = body_node;
        this.should_return_null = should_return_null;
        this.prevent_null_return = prevent_null_return;
    }

    public toString() {
        if (this.key_name_tok) {
            return `ForeachNode(${this.list_node} as ${this.key_name_tok} => ${this.value_name_tok})`
        } else {
            return `ForeachNode(${this.list_node} as ${this.value_name_tok})`
        }
    }
}

export class WhileNode extends CustomNode {
    public readonly condition_node: CustomNode;
    public readonly body_node: CustomNode;
    public readonly should_return_null: boolean
    
    /**
     * @param condition_node The condition needed to evaluate the body.
     * @param body_node What gets evaluated on every iteration.
     * @param should_return_null Should return null? False for inline loops.
     */
    constructor(condition_node: CustomNode, body_node: CustomNode, should_return_null: boolean) {
        super(condition_node.pos_start, body_node.pos_end);
        this.condition_node = condition_node;
        this.body_node = body_node;
        this.should_return_null = should_return_null;
    }

    public toString() {
        return `WhileNode`; // TODO:: can do better
    }
}

/**
 * @classdesc Describes the declaration of a function.
 */
export class FuncDefNode extends CustomNode {
    public readonly var_name_tok: Token | null;
    public readonly args: ArgumentNode[];
    public readonly body_node: CustomNode;
    public readonly should_auto_return: boolean;

    private static guessPosStart(var_name: Token | null, args: ArgumentNode[], body: CustomNode) {
        if (var_name) {
            return var_name.pos_start;
        } else if (args.length > 0) {
            return args[0].pos_start;
        } else {
            return body.pos_start;
        }
    }

    /**
     * @param var_name_tok The identifier that corresponds to the name of the function. Might be null for anonymous functions.
     * @param args The arguments.
     * @param body_node The body of the function.
     * @param should_auto_return Should auto return? True if the function is an arrow function.
     */
    constructor(var_name_tok: Token | null, args: ArgumentNode[], body_node: CustomNode, should_auto_return: boolean) {
        super(FuncDefNode.guessPosStart(var_name_tok, args, body_node), body_node.pos_end);
        this.var_name_tok = var_name_tok;
        this.args = args;
        this.body_node = body_node;
        this.should_auto_return = should_auto_return;
    }

    public toString() {
        return `func ${this.var_name_tok ? this.var_name_tok.value : ''}(${this.args.map(v => v.arg_name_tok.value).join(', ')})`;
    }
}

/**
 * @classdesc Describes the call to a function.
 */
export class CallNode extends CustomNode {
    public readonly node_to_call: CustomNode;
    public readonly arg_nodes: CustomNode[];
    public readonly is_optional: boolean;

    /**
     * @param node_to_call The identifier that corresponds to the name of the function to be called.
     * @param arg_nodes The list of arguments.
     * @param is_optional Is the optional chaining operator present?
     */
    constructor(node_to_call: CustomNode, arg_nodes: CustomNode[], is_optional: boolean = false) {
        super(node_to_call.pos_start, arg_nodes.length > 0 ? arg_nodes[arg_nodes.length - 1].pos_end : node_to_call.pos_end);
        this.node_to_call = node_to_call;
        this.arg_nodes = arg_nodes;
        this.is_optional = is_optional;
    }

    public toString() {
        return `(call ${this.node_to_call}(${this.arg_nodes.length} arg${this.arg_nodes.length > 1 ? 's' : ''}))`;
    }
}

/**
 * @classdesc A return keyword.
 */
export class ReturnNode extends CustomNode {
    public readonly node_to_return: CustomNode | null;

    /**
     * @param node_to_return The value that we must return.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(node_to_return: CustomNode | null, pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.node_to_return = node_to_return;
    }

    public toString() {
        return `(return ${this.node_to_return ?? ''})`;
    }
}

/**
 * @classdesc A continue keyword.
 */
export class ContinueNode extends CustomNode {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
    }

    public toString() {
        return "(continue)";
    }
}

/**
 * @classdesc A break keyword.
 */
export class BreakNode extends CustomNode {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
    }

    public toString() {
        return "(break)";
    }
}

/**
 * @classdesc Creates a constant.
 */
export class DefineNode extends CustomNode {
    public readonly var_name_tok: Token;
    public readonly value_node: CustomNode;
    public readonly type: string;

    /**
     * @param var_name_tok The name of the variable.
     * @param value_node The value of the variable.
     * @param type The type of the variable (by default "ANY").
     */
    constructor(var_name_tok: Token, value_node: CustomNode, type: string) {
        super(var_name_tok.pos_start, value_node.pos_end);
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.type = type;
    }

    public toString() {
        return `(define ${this.var_name_tok.value}${this.type && this.type !== Types.ANY ? ': ' + this.type : ''} = ${this.value_node})`;
    }
}

/**
 * @classdesc Deletes a value.
 */
export class DeleteNode extends CustomNode {
    public readonly node_to_delete: CustomNode;

    /**
     * @param node_to_delete The name of the variable.
     * @param pos_start The starting position of the node.
     * @param pos_end The end position of the node.
     */
    constructor(node_to_delete: CustomNode, pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.node_to_delete = node_to_delete;
    }

    public toString() {
        return `(delete ${this.node_to_delete})`;
    }
}

/**
 * @classdesc Describes the call to a property (`example.property`)
 */
export class CallPropertyNode extends CustomNode {
    public readonly node_to_call: CustomNode;
    public readonly property_tok: Token;
    public readonly is_optional: boolean;

    /**
     * @param node_to_call The node to call.
     * @param property_tok The token of the property to be called.
     * @param is_optional Is the optional chaining operator present? (example.first?.second)
     */
    constructor(node_to_call: CustomNode, property_tok: Token, is_optional: boolean = false) {
        super(node_to_call.pos_start, property_tok.pos_end);
        this.node_to_call = node_to_call;
        this.property_tok = property_tok;
        this.is_optional = is_optional;
    }

    public toString() {
        return `(property ${this.node_to_call}${this.is_optional ? '?' : ''}.${this.property_tok.value})`;
    }
}

/**
 * @classdesc Describes the call to a static property (`example::property`)
 */
export class CallStaticPropertyNode extends CustomNode {
    public readonly node_to_call: CustomNode;
    public readonly property_tok: Token;
    public readonly is_optional: boolean;

    /**
     * @param node_to_call The node to call.
     * @param property_tok The token of the property to be called.
     * @param is_optional Is the optional chaining operator present? (Example?::first)
     */
    constructor(node_to_call: CustomNode, property_tok: Token, is_optional: boolean = false) {
        super(node_to_call.pos_start, property_tok.pos_end);
        this.node_to_call = node_to_call;
        this.property_tok = property_tok;
        this.is_optional = is_optional;
    }

    public toString() {
        return `(property ${this.node_to_call}${this.is_optional ? '?' : ''}::${this.property_tok.value})`;
    }
}

/**
 * @classdesc Describes the call to a method (`example.method()`)
 */
export class CallMethodNode extends CustomNode {
    public readonly node_to_call: CustomNode;
    public readonly origin: CustomNode;
    public readonly is_optional: boolean;

    /**
     * @param node_to_call The node to call.
     * @param origin The property to be called.
     * @param is_optional Is the optional chaining operator present? (test.imaginaryMethod?.())
     */
    constructor(node_to_call: CallNode, origin: CustomNode, is_optional: boolean = false) {
        super(origin.pos_start, node_to_call.pos_end);
        this.node_to_call = node_to_call;
        this.origin = origin;
        this.is_optional = is_optional;
    }

    public toString() {
        return `(method${this.is_optional ? '?' : ''} ${this.origin}.${this.node_to_call}`;
    }
}

/**
 * @classdesc Describes the declaration of a property in a class.
 */
export class ClassPropertyDefNode extends CustomNode {
    public readonly property_name_tok: Token;
    public readonly value_node: CustomNode;
    public readonly type: string | null;
    public readonly status: Visibility;
    public readonly override: number; // 1 for override, 0 otherwise.
    public readonly static_prop: number; // 1 for static, 0 otherwise.

    /**
     * @param property_name_tok The name of the variable.
     * @param value_node The value of the variable.
     * @param type The type of the variable.
     * @param status 0 for private, 1 for public, 2 for protected.
     * @param override 1 for override, 0 otherwise.
     * @param static_prop 1 for static, 0 otherwise.
     */
    constructor(property_name_tok: Token, value_node: CustomNode, type: string | null, status: Visibility, override: number, static_prop: number) {
        super(property_name_tok.pos_start, value_node.pos_end);
        this.property_name_tok = property_name_tok;
        this.value_node = value_node;
        this.type = type;
        this.status = status;
        this.override = override;
        this.static_prop = static_prop;
    }

    public toString() {
        let visibility = "";
        switch (this.status) {
            case Visibility.Private: visibility = "private"; break;
            case Visibility.Public: visibility = "public"; break;
            case Visibility.Protected: visibility = "protected"; break;
        }
        return `(${visibility} ${ this.override ? 'override' : '' } ${ this.property_name_tok.value }${ this.type && this.type !== Types.ANY ? ': ' + this.type : '' } = ${ this.value_node })`;
    }
}

/**
 * @classdesc Describes the declaration of a method.
 */
export class ClassMethodDefNode extends CustomNode {
    public readonly func: FuncDefNode;
    public readonly status: Visibility;
    public readonly override: number;
    public readonly static_prop: number

    /**
     * @param func The function itself.
     * @param status 0 for private, 1 for public, 2 for protected.
     * @param override 1 for override, 0 otherwise.
     * @param static_prop 1 for static, 0 otherwise.
     */
    constructor(func: FuncDefNode, status: Visibility, override: number, static_prop: number) {
        super(func.pos_start, func.pos_end);
        this.func = func;
        this.status = status;
        this.override = override;
        this.static_prop = static_prop;
    }

    public toString() {
        let visibility = "";
        switch (this.status) {
            case Visibility.Private: visibility = "private"; break;
            case Visibility.Public: visibility = "public"; break;
            case Visibility.Protected: visibility = "protected"; break;
        }
        return `(${visibility} ${this.override ? 'override' : ''} method ${this.func.var_name_tok!.value})`;
    }
}

/**
 * @classdesc Describes the declaration of a class.
 */
export class ClassDefNode extends CustomNode {
    public readonly class_name_tok: Token;
    public readonly parent_class_tok: Token | null;
    public readonly properties: ClassPropertyDefNode[];
    public readonly methods: ClassMethodDefNode[];
    public readonly getters: ClassMethodDefNode[];
    public readonly setters: ClassMethodDefNode[];

    /**
     * @param class_name_tok The identifier that corresponds to the name of the class.
     * @param parent_class_tok The identifier that corresponds to the name of the parent class.
     * @param properties All the properties of the class.
     * @param methods All the methods of the class.
     * @param getters All the getters of the class.
     * @param setters All the setters of the class.
     * @param pos_start The starting position of the declaration.
     * @param pos_end The end position of the declaration.
     */
    constructor(class_name_tok: Token, parent_class_tok: Token | null, properties: ClassPropertyDefNode[], methods: ClassMethodDefNode[], getters: ClassMethodDefNode[], setters: ClassMethodDefNode[], pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.class_name_tok = class_name_tok;
        this.parent_class_tok = parent_class_tok;
        this.properties = properties;
        this.methods = methods;
        this.getters = getters;
        this.setters = setters;
    }

    public toString() {
        return `(Class ${this.class_name_tok.value})`;
    }
}

/**
 * @classdesc Describes the declaration of a tag.
 */
export class TagDefNode extends CustomNode {
    public readonly tag_name_tok: Token;
    public readonly props: TagPropDefNode[];
    public readonly states: TagStateDefNode[];
    public readonly methods: FuncDefNode[];

    /**
     * @constructs TagDefNode
     * @param {Token} tag_name_tok The identifier that corresponds to the name of the tag.
     * @param {Array<TagPropDefNode>} props All the props of the tag.
     * @param {Array<TagStateDefNode>} states All the state variables of the tag.
     * @param {Array<FuncDefNode>} methods All the methods of the tag.
     * @param {Position} pos_start The starting position of the declaration.
     * @param {Position} pos_end The end position of the declaration.
     */
    constructor(tag_name_tok: Token, props: TagPropDefNode[], states: TagStateDefNode[], methods: FuncDefNode[], pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.tag_name_tok = tag_name_tok;
        this.props = props;
        this.states = states;
        this.methods = methods;
    }

    public toString() {
        return `(tag ${this.tag_name_tok.value})`;
    }
}

/**
 * @classdesc Describes the declaration of a prop in a tag.
 */
export class TagPropDefNode extends CustomNode {
    public readonly property_name_tok: Token;
    public readonly value_node: CustomNode;
    public readonly type: string;
    public readonly optional: number; // 1 for true

    /**
     * @param property_name_tok The name of the variable.
     * @param value_node The value of the variable.
     * @param type The type of the variable.
     * @param optional Is the prop optional? 1 for true.
     */
    constructor(property_name_tok: Token, value_node: CustomNode, type: string, optional: number) {
        super(property_name_tok.pos_start, value_node.pos_end);
        this.property_name_tok = property_name_tok;
        this.value_node = value_node;
        this.type = type;
        this.optional = optional;
    }

    public toString() {
        return `(prop ${this.property_name_tok.value}${this.type && this.type !== Types.ANY ? ': ' + this.type : ''} = ${this.value_node})`;
    }
}

/**
 * @classdesc Describes the declaration of a state variable in a tag.
 */
export class TagStateDefNode extends CustomNode {
    public readonly property_name_tok: Token;
    public readonly value_node: CustomNode;
    public readonly type: string;

    /**
     * @param property_name_tok The name of the variable.
     * @param value_node The value of the variable.
     * @param type The type of the variable.
     */
    constructor(property_name_tok: Token, value_node: CustomNode, type: string) {
        super(property_name_tok.pos_start, value_node.pos_end);
        this.property_name_tok = property_name_tok;
        this.value_node = value_node;
        this.type = type;
    }

    public toString() {
        return `(state ${this.property_name_tok.value}${this.type && this.type !== Types.ANY ? ': ' + this.type : ''} = ${this.value_node})`;
    }
}

/**
 * @classdesc Describes the call to a class (new Class())
 */
export class ClassCallNode extends CustomNode {
    public readonly class_name_tok: Token;
    public readonly arg_nodes: CustomNode[];

    /**
     * @param class_name_tok The identifier that corresponds to the name of the class to be called.
     * @param arg_nodes The list of arguments (for __init).
     */
    constructor(class_name_tok: Token, arg_nodes: CustomNode[]) {
        super(class_name_tok.pos_start, arg_nodes.length > 0 ? arg_nodes[arg_nodes.length - 1].pos_end : class_name_tok.pos_end);
        this.class_name_tok = class_name_tok;
        this.arg_nodes = arg_nodes;
    }

    public toString() {
        return `(new ${this.class_name_tok})`;
    }
}

/**
 * @classdesc Allows our program to modify the value of properties (`self.age = 17`)
 */
export class AssignPropertyNode extends CustomNode {
    public readonly property: CallPropertyNode | CallStaticPropertyNode;
    public readonly value_node: CustomNode;

    /**
     * @param property The property to be modified.
     * @param value_node The new value.
     */
    constructor(property: CallPropertyNode | CallStaticPropertyNode, value_node: CustomNode) {
        super(property.pos_start, property.pos_end);
        this.property = property;
        this.value_node = value_node;
    }

    public toString() {
        return `(${this.property} = ${this.value_node})`;
    }
}

/**
 * @classdesc Describes a call to the parent's method.
 */
export class SuperNode extends CustomNode {
    public readonly arg_nodes: CustomNode[];

    /**
     * @param arg_nodes The list of arguments.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(arg_nodes: CustomNode[], pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.arg_nodes = arg_nodes;
    }

    public toString() {
        return `(super (${this.arg_nodes.length} args))`;
    }
}

/**
 * @classdesc Describes an argument inside the declaration of a function.
 */
export class ArgumentNode extends CustomNode {
    public readonly arg_name_tok: Token;
    public readonly type: string;
    public readonly is_rest: boolean;
    public readonly is_optional: boolean;
    public readonly default_value_node: CustomNode | Value | null;

    /**
     * @param arg_name_tok The name of the argument.
     * @param type The type of the argument.
     * @param is_rest Is a rest parameter?
     * @param is_optional Is optional?
     * @param default_value_node The default value in case the argument is optional. It might be a Value if this is native.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(arg_name_tok: Token, type: string = Types.ANY, is_rest: boolean = false, is_optional: boolean = false, default_value_node: CustomNode | Value | null = null, pos_start: Position | null = null, pos_end: Position | null = null) {
        super(pos_start ? pos_start : arg_name_tok.pos_start, pos_end ?? (default_value_node !== null ? default_value_node.pos_end! : arg_name_tok.pos_end));
        this.arg_name_tok = arg_name_tok;
        this.type = type;
        this.is_rest = is_rest;
        this.is_optional = is_optional;
        this.default_value_node = default_value_node;
    }

    public toString() {
        return `(${this.is_rest ? '...' : ''}${this.arg_name_tok.value}${this.is_optional ? '?' : ''}${this.type !== Types.ANY && !this.is_rest ? ': ' + this.type : ''}${this.default_value_node ? '=' + this.default_value_node : ''})`;
    }
}

/**
 * @classdesc Describes an Enum
 */
export class EnumNode extends CustomNode {
    public readonly enum_name_tok: Token;
    public readonly properties: Token[];

    /**
     * @param enum_name_tok The name of the enum
     * @param properties The names of the properties
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(enum_name_tok: Token, properties: Token[], pos_start: Position | null = null, pos_end: Position | null = null) {
        super(pos_start ?? enum_name_tok.pos_start, pos_end ?? properties.at(-1)!.pos_end);
        this.enum_name_tok = enum_name_tok;
        this.properties = properties;
    }

    public toString() {
        return `(enum ${this.enum_name_tok.toString()} { ... })`;
    }
}

export class SwitchNode extends CustomNode {
    public readonly primary_value: CustomNode;
    public readonly cases: SwitchCase[];
    public readonly default_case: CustomNode | null;

    /**
     * @param primary_value The value being tested.
     * @param cases The cases with their condition and statements.
     * @param default_case The statements of the default case.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(primary_value: CustomNode, cases: SwitchCase[], default_case: CustomNode | null, pos_start: Position | null = null, pos_end: Position | null = null) {
        super(pos_start ?? primary_value.pos_start, pos_end ?? (default_case !== null ? default_case.pos_end : cases.at(-1)!.body.pos_end));
        this.primary_value = primary_value;
        this.cases = cases;
        this.default_case = default_case;
    }

    public toString() {
        return `(switch ${this.primary_value}(${this.cases.length + (this.default_case ? 1 : 0)} case${this.cases.length + (this.default_case ? 1 : 0) > 1 ? 's' : ''}))`;
    }
}

export class NoneNode extends CustomNode {
    /**
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
    }

    public toString() {
        return `(none)`;
    }
}

export class BooleanNode extends CustomNode {
    public readonly state: number; // 1 for true, 0 for false
    public readonly display_name: string; // "true", "yes", "no" or "false"

    /**
     * @param state true or false?
     * @param display_name "true", "yes", "no" or "false"?
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(state: number, display_name: string, pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.state = state;
        this.display_name = display_name;
    }

    public toString() {
        return `(${this.display_name})`;
    }
}

export class TypeofNode extends CustomNode {
    public readonly node: CustomNode;

    /**
     * @param node The node.
     */
    constructor(node: CustomNode) {
        super(node.pos_start, node.pos_end);
        this.node = node;
    }

    public toString() {
        return `(typeof ${this.node})`;
    }
}

export class InstanceofNode extends CustomNode {
    public readonly node_a: CustomNode;
    public readonly class_name_tok: Token;

    /**
     * @param node_a The node.
     * @param class_name_tok The class name.
     */
    constructor(node_a: CustomNode, class_name_tok: Token) {
        super(node_a.pos_start, class_name_tok.pos_end);
        this.node_a = node_a;
        this.class_name_tok = class_name_tok;
    }

    public toString() {
        return `(${this.node_a} instanceof ${this.class_name_tok.value})`;
    }
}

export class HtmlNode extends CustomNode {
    public readonly tagname_tok: Token | null;
    public readonly classes: string[];
    public readonly id: string | null;
    public readonly attributes: [Token, CustomNode][];
    public readonly events: [Token, CustomNode][];
    public readonly children: CustomNode[];

    /**
     * @param tagname_tok The name of the tag. Null for fragment.
     * @param classes The classes attached to that tag.
     * @param id The id attached to that tag. Null because it's optional.
     * @param attributes The attributes attached to that tag.
     * @param events The events attached to that tag.
     * @param children The children elements. Might be other HtmlNodes or any other CustomNode.
     * @param pos_start The starting position.
     * @param pos_end The end position.
     */
    constructor(tagname_tok: Token | null, classes: string[], id: string | null, attributes: [Token, CustomNode][], events: [Token, CustomNode][], children: CustomNode[], pos_start: Position, pos_end: Position) {
        super(pos_start, pos_end);
        this.tagname_tok = tagname_tok;
        this.classes = classes;
        this.id = id;
        this.attributes = attributes;
        this.events = events;
        this.children = children;
    }

    public toString() {
        return `<${this.tagname_tok?.value ?? ''}${this.classes.map((v) => '.' + v)}${this.id ? '#' + this.id : ''} (${this.attributes.length} attribute${this.attributes.length > 1 ? 's' : ''}) (${this.events.length} event${this.events.length > 1 ? 's' : ''})> (${this.children.length} ${this.children.length > 1 ? 'children' : 'child'})`;
    }
}