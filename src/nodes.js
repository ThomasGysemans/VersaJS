import { Position } from "./position.js";
import { Token } from "./tokens.js";

/**
 * @classdesc A node in the program.
 */
export class CustomNode {
    /**
     * @constructs CustomNode
     */
    constructor() {
        this.set_pos();
    }

    /**
     * Sets the position of the node in the code.
     * @param {Position} pos_start The starting position of the node.
     * @param {Position} pos_end The end position of the node.
     * @returns {this}
     */
    set_pos(pos_start=null, pos_end=null) {
        this.pos_start = pos_start;
        this.pos_end = pos_end;
        return this;
    }
}

export class NumberNode extends CustomNode {
    /**
     * @constructs NumberNode
     * @param {Token} token The value of that node.
     */
    constructor(token) {
        super();
        this.value = token.value;

        this.set_pos(token.pos_start, token.pos_end);
    }

    toString() {
        return `${this.value}`;
    }
}

export class AddNode extends CustomNode {
    /**
     * @constructs AddNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}+${this.node_b})`;
    }
}

export class SubtractNode extends CustomNode {
    /**
     * @constructs SubtractNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}-${this.node_b})`;
    }
}

export class MultiplyNode extends CustomNode {
    /**
     * @constructs MultiplyNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}*${this.node_b})`;
    }
}

export class DivideNode extends CustomNode {
    /**
     * @constructs DivideNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b, ) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}/${this.node_b})`;
    }
}

// Unary operations
// like -5 or +5

export class PlusNode extends CustomNode {
    /**
     * @constructs PlusNode
     * @param {CustomNode} node The node.
     */
    constructor(node) {
        super();
        this.node = node;

        this.set_pos(node.pos_start, node.pos_end);
    }

    toString() {
        return `(+${this.node})`;
    }
}

export class MinusNode extends CustomNode {
    /**
     * @constructs MinusNode
     * @param {CustomNode} node The node.
     */
    constructor(node) {
        super();
        this.node = node;

        this.set_pos(node.pos_start, node.pos_end);
    }

    toString() {
        return `(-${this.node})`;
    }
}

export class PrefixOperationNode extends CustomNode {
    /**
     * @constructs IncrementBeforeNode
     * @param {CustomNode} node The node.
     * @param {number} difference How many times there is the incrementation token?
     */
    constructor(node, difference) {
        super();
        this.node = node;
        this.difference = difference;

        this.set_pos(node.pos_start, node.pos_end);
    }

    toString() {
        if (this.difference < 0) {
            return `(${'--'.repeat(Math.abs(this.difference))}${this.node})`;
        } else {
            return `(${'++'.repeat(this.difference)}${this.node})`;
        }
    }
}

export class PostfixOperationNode extends CustomNode {
    /**
     * @constructs PostfixOperationNode
     * @param {CustomNode} node The node.
     * @param {number} difference How many times there is the incrementation token?
     */
    constructor(node, difference) {
        super();
        this.node = node;
        this.difference = difference;

        this.set_pos(node.pos_start, node.pos_end);
    }

    toString() {
        if (this.difference < 0) {
            return `(${this.node}${'--'.repeat(Math.abs(this.difference))})`;
        } else {
            return `(${this.node}${'++'.repeat(this.difference)})`;
        }
    }
}

export class PowerNode extends CustomNode {
    /**
     * @constructs PowerNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}**${this.node_b})`;
    }
}

export class ModuloNode extends CustomNode {
    /**
     * @constructs ModuloNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}%${this.node_b})`;
    }
}

export class BinaryShiftLeftNode extends CustomNode {
    /**
     * @constructs BinaryShiftLeftNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}<<${this.node_b})`;
    }
}

export class BinaryShiftRightNode extends CustomNode {
    /**
     * @constructs BinaryShiftRightNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}>>${this.node_b})`;
    }
}

export class UnsignedBinaryShiftRightNode extends CustomNode {
    /**
     * @constructs UnsignedBinaryShiftRightNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a}>>>${this.node_b})`;
    }
}

/**
 * @classdesc Creates a variable by saving its name and its value.
 */
export class VarAssignNode extends CustomNode {
    /**
     * @constructs VarAssignNode
     * @param {Token} var_name_tok The name of the variable.
     * @param {CustomNode} value_node The value of the variable.
     */
    constructor(var_name_tok, value_node) {
        super();
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.value_node.pos_end;
    }

    toString() {
        return `(var ${this.var_name_tok.value} = ${this.value_node})`;
    }
}

/**
 * @classdesc Creates a variable by saving its name and its value.
 */
export class NullishOperatorNode extends CustomNode {
    /**
     * @constructs NullishOperatorNode
     * @param {CustomNode} node_a The value of the wanted value.
     * @param {CustomNode} node_b The value of the default value.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;
        this.pos_start = this.node_a.pos_start;
        this.pos_end = this.node_b.pos_end;
    }
    
    toString() {
        return `(${this.node_a} ?? ${this.node_b})`;
    }
}

/**
 * @classdesc Allows our program to access existing variables.
 */
export class VarAccessNode extends CustomNode {
    /**
     * @constructs VarAccessNode
     * @param {Token} var_name_tok The token that represents a variable.
     */
    constructor(var_name_tok) {
        super();
        this.var_name_tok = var_name_tok;
        this.pos_start = var_name_tok.pos_start;
        this.pos_end = var_name_tok.pos_end;
    }

    toString() {
        return `(${this.var_name_tok.value})`;
    }
}

/**
 * @classdesc Allows our program to access existing variables.
 */
export class VarModifyNode extends CustomNode {
    /**
     * @constructs VarModifyNode
     * @param {Token} var_name_tok The token that represents a variable.
     * @param {CustomNode} value_node The value of the variable.
     */
    constructor(var_name_tok, value_node) {
        super();
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.pos_start = var_name_tok.pos_start;
        this.pos_end = var_name_tok.pos_end;
    }

    toString() {
        return `(${this.var_name_tok.value} = ${this.value_node})`;
    }
}

export class AndNode extends CustomNode {
    /**
     * @constructs AndNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} and ${this.node_b})`;
    }
}

export class OrNode extends CustomNode {
    /**
     * @constructs OrNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} or ${this.node_b})`;
    }
}

export class NotNode extends CustomNode {
    /**
     * @constructs NotNode
     * @param {CustomNode} node The node.
     */
    constructor(node) {
        super();
        this.node = node;

        this.set_pos(node.pos_start, node.pos_end);
    }

    toString() {
        return `(not ${this.node})`;
    }
}

export class NotEqualsNode extends CustomNode {
    /**
     * @constructs NotEqualsNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} != ${this.node_b})`;
    }
}

export class EqualsNode extends CustomNode {
    /**
     * @constructs EqualsNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} == ${this.node_b})`;
    }
}

export class LessThanNode extends CustomNode {
    /**
     * @constructs LessThanNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} < ${this.node_b})`;
    }
}

export class LessThanOrEqualNode extends CustomNode {
    /**
     * @constructs LessThanOrEqualNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} <= ${this.node_b})`;
    }
}

export class GreaterThanNode extends CustomNode {
    /**
     * @constructs GreaterThanNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} > ${this.node_b})`;
    }
}

export class GreaterThanOrEqualNode extends CustomNode {
    /**
     * @constructs LessThanOrEqualNode
     * @param {CustomNode} node_a The left node.
     * @param {CustomNode} node_b The right node.
     */
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;

        this.set_pos(node_a.pos_start, node_b.pos_end);
    }

    toString() {
        return `(${this.node_a} >= ${this.node_b})`;
    }
}

export class ListNode extends CustomNode {
    /**
     * @constructs ListNode
     * @param {Array<CustomNode>} element_nodes The token that represents a string.
     * @param {Position} pos_start The starting position of the list (we must have it from the constructor because of empty lists).
     * @param {Position} pos_end The end position of the list (we must have it from the constructor because of empty lists).
     */
    constructor(element_nodes, pos_start, pos_end) {
        super();
        this.element_nodes = element_nodes;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `[${this.element_nodes.join(', ')}]`;
    }
}

export class DictionnaryElementNode extends CustomNode {
    /**
     * @constructs DictionnaryElementNode
     * @param {StringNode} key The key of the element.
     * @param {CustomNode} value The value of that element.
     */
    constructor(key, value) {
        super();
        this.key = key;
        this.value = value;
        this.pos_start = key.pos_start;
        this.pos_end = value.pos_end;
    }

    toString() {
        return `(${this.key}: ${this.value})`;
    }
}

export class DictionnaryNode extends CustomNode {
    /**
     * @constructs DictionnaryNode
     * @param {Array<DictionnaryElementNode>} element_nodes The token that represents a string.
     * @param {Position} pos_start The starting position of the list (we must have it from the constructor because of empty lists).
     * @param {Position} pos_end The end position of the list (we must have it from the constructor because of empty lists).
     */
    constructor(element_nodes, pos_start, pos_end) {
        super();
        this.element_nodes = element_nodes;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `{${this.element_nodes.join(', ')}}`;
    }
}

export class ListAccessNode extends CustomNode {
    /**
     * @constructs ListAccessNode
     * @param {CustomNode} node_to_access The token that represents a variable.
     * @param {number} depth The depth of the array.
     * @param {Array<CustomNode>} list_nodes The expressions between the brackets.
     */
    constructor(node_to_access, depth, list_nodes) {
        super();
        this.node_to_access = node_to_access;
        this.depth = depth;
        this.list_nodes = list_nodes;
        this.pos_start = node_to_access.pos_start;
        this.pos_end = node_to_access.pos_end;
    }

    toString() {
        return `(${this.node_to_access}[expr])`;
    }
}

export class ListAssignmentNode extends CustomNode {
    /**
     * @constructs ListAssignmentNode
     * @param {ListAccessNode} accessor The access node of the list.
     * @param {CustomNode} new_value_node The new value.
     */
    constructor(accessor, new_value_node) {
        super();
        this.accessor = accessor;
        this.new_value_node = new_value_node;
        this.pos_start = accessor.pos_start;
        this.pos_end = accessor.pos_end;
    }

    toString() {
        return `(${this.accessor.node_to_access}[...] = ${this.new_value_node})`;
    }
}

export class ListPushBracketsNode extends CustomNode {
    /**
     * @constructs ListPushBracketsNode
     * @param {Position} pos_start The starting position
     * @param {Position} pos_end The end position
     */
    constructor(pos_start, pos_end) {
        super();
        this.value = 0;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `(list[])`;
    }
}

export class ListBinarySelector extends CustomNode {
    /**
     * @constructs ListBinarySelector
     * @param {CustomNode|null} node_a The beginning of the getter.
     * @param {CustomNode|null} node_b The end of the getter.
     * @param {Position} pos_start The starting position of the binary selector.
     * @param {Position} pos_end The end position of the binary selector.
     */
    constructor(node_a, node_b, pos_start, pos_end) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `([${this.node_a ? this.node_a : ''}:${this.node_b ? this.node_b : ''}])`;
    }
}

/**
 * @classdesc This node represents a string while reading the tokens.
 */
export class StringNode extends CustomNode {
    /**
     * @constructs StringNode
     * @param {Token} token The token that represents a string.
     * @param {boolean} allow_concatenation
     */
    constructor(token, allow_concatenation=false) {
        super();
        this.token = token;
        this.pos_start = this.token.pos_start;
        this.pos_end = this.token.pos_end;
        this.allow_concatenation = allow_concatenation;
    }

    toString() {
        return `${this.token}`;
    }
}

export class IfNode extends CustomNode {
    /**
     * @constructs IfNode
     * @param {Array} cases The cases [[condition, expr, should_return_null]].
     * @param {{code: any, should_return_null: boolean}} else_case The else case.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(cases, else_case, pos_start, pos_end) {
        super();
        this.cases = cases;
        this.else_case = else_case;
        
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `IfNode(${this.cases.length} cases)`;
    }
}

export class ForNode extends CustomNode {
    /**
     * @constructs ForNode
     * @param {Token} var_name_tok The name of the variable in the for statement (i).
     * @param {CustomNode} start_value_node The starting value.
     * @param {CustomNode} end_value_node The value it will go up to.
     * @param {CustomNode} step_value_node The step between each iteration.
     * @param {CustomNode} body_node What gets evaluated on every iteration.
     * @param {boolean} should_return_null Should return null? False for inline loops.
     */
    constructor(var_name_tok, start_value_node, end_value_node, step_value_node, body_node, should_return_null) {
        super();
        this.var_name_tok = var_name_tok;
        this.start_value_node = start_value_node;
        this.end_value_node = end_value_node;
        this.step_value_node = step_value_node;
        this.body_node = body_node;
        this.should_return_null = should_return_null;

        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.body_node.pos_end;
    }

    toString() {
        return `ForNode`;
    }
}

export class ForeachNode extends CustomNode {
    /**
     * @constructs ForeachNode
     * @param {CustomNode} list_node The list on which we want to loop.
     * @param {Token|null} key_name_tok The variable that will get the name of the key as value. This will be the index if we loop on a list.
     * @param {Token} value_name_tok The variable that will be the value
     * @param {CustomNode} body_node The body of the foreach statement.
     * @param {boolean} should_return_null Should return null? `true` for a multiline statement.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(list_node, key_name_tok, value_name_tok, body_node, should_return_null, pos_start, pos_end) {
        super();
        this.list_node = list_node;
        this.key_name_tok = key_name_tok;
        this.value_name_tok = value_name_tok;
        this.body_node = body_node;
        this.should_return_null = should_return_null;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        if (this.key_name_tok) {
            return `ForeachNode(${this.list_node} as ${this.key_name_tok} => ${this.value_name_tok})`
        } else {
            return `ForeachNode(${this.list_node} as ${this.value_name_tok})`
        }
    }
}

export class WhileNode extends CustomNode {
    /**
     * @constructs WhileNode
     * @param {CustomNode} condition_node The condition needed to evaluate the body.
     * @param {CustomNode} body_node What gets evaluated on every iteration.
     * @param {boolean} should_return_null Should return null? False for inline loops.
     */
    constructor(condition_node, body_node, should_return_null) {
        super();
        this.condition_node = condition_node;
        this.body_node = body_node;
        this.should_return_null = should_return_null;
        
        this.pos_start = this.condition_node.pos_start;
        this.pos_end = this.body_node.pos_end;
    }

    toString() {
        return `WhileNode`;
    }
}

/**
 * @classdesc Describes the declaration of a function.
 */
export class FuncDefNode extends CustomNode {
    /**
     * @constructs FuncDefNode
     * @param {Token|null} var_name_tok The identifier that corresponds to the name of the function. Might be null for anonymous functions.
     * @param {Array<ArgumentNode>} args The arguments.
     * @param {CustomNode} body_node The body of the function.
     * @param {boolean} should_auto_return Should auto return? True if the function is an arrow function.
     */
    constructor(var_name_tok, args, body_node, should_auto_return) {
        super();
        this.var_name_tok = var_name_tok;
        this.args = args;
        this.body_node = body_node;
        this.should_auto_return = should_auto_return;

        if (this.var_name_tok) {
            this.pos_start = this.var_name_tok.pos_start;
        } else if (this.args.length > 0) {
            this.pos_start = this.args[0].pos_start;
        } else {
            this.pos_start = this.body_node.pos_start;
        }

        this.pos_end = this.body_node.pos_end;
    }

    toString() {
        return `func ${this.var_name_tok ? this.var_name_tok.value : ''}(${this.args.map((v) => v.arg_name_tok.value).join(', ')})`;
    }
}

/**
 * @classdesc Describes the call to a function.
 */
export class CallNode extends CustomNode {
    /**
     * @constructs CallNode
     * @param {CustomNode} node_to_call The identifier that corresponds to the name of the function to be called.
     * @param {Array<CustomNode>} arg_nodes The list of arguments.
     */
    constructor(node_to_call, arg_nodes) {
        super();
        this.node_to_call = node_to_call;
        this.arg_nodes = arg_nodes;

        this.pos_start = this.node_to_call.pos_start;

        if (this.arg_nodes.length > 0) {
            this.pos_end = this.arg_nodes[this.arg_nodes.length - 1].pos_end;
        } else {
            this.pos_end = this.node_to_call.pos_end;
        }
    }

    toString() {
        return `(call ${this.node_to_call}(${this.arg_nodes.length} args))`;
    }
}

/**
 * @classdesc A return keyword.
 */
export class ReturnNode extends CustomNode {
    /**
     * @constructs ReturnNode
     * @param {CustomNode|null} node_to_return The value that we must return.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(node_to_return, pos_start, pos_end) {
        super();
        this.node_to_return = node_to_return;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

/**
 * @classdesc A return keyword.
 */
export class ContinueNode extends CustomNode {
    /**
     * @constructs ContinueNode
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(pos_start, pos_end) {
        super();
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

/**
 * @classdesc A return keyword.
 */
export class BreakNode extends CustomNode {
    /**
     * @constructs BreakNode
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(pos_start, pos_end) {
        super();
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

/**
 * @classdesc Creates a constant.
 */
export class DefineNode extends CustomNode {
    /**
     * @constructs DefineNode
     * @param {Token} var_name_tok The name of the variable.
     * @param {CustomNode} value_node The value of the variable.
     */
    constructor(var_name_tok, value_node) {
        super();
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.value_node.pos_end;
    }

    toString() {
        return `(define ${this.var_name_tok.value} = ${this.value_node})`;
    }
}

/**
 * @classdesc Deletes a value.
 */
export class DeleteNode extends CustomNode {
    /**
     * @constructs DeleteNode
     * @param {CustomNode} node_to_delete The name of the variable.
     * @param {Position} pos_start The starting position of the node.
     * @param {Position} pos_end The end position of the node.
     */
    constructor(node_to_delete, pos_start, pos_end) {
        super();
        this.node_to_delete = node_to_delete;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `(delete ${this.node_to_delete})`;
    }
}

/**
 * @classdesc Describes the call to a property (`example.property`)
 */
export class CallPropertyNode extends CustomNode {
    /**
     * @constructs CallPropertyNode
     * @param {CustomNode} node_to_call The node to call.
     * @param {Token} property_tok The token of the property to be called.
     */
    constructor(node_to_call, property_tok) {
        super();
        this.node_to_call = node_to_call;
        this.property_tok = property_tok;
        this.pos_start = this.node_to_call.pos_start;
        this.pos_end = this.property_tok.pos_end;
    }

    toString() {
        return `(prop ${this.node_to_call}.${this.property_tok.value})`;
    }
}

/**
 * @classdesc Describes the call to a static property (`example.property`)
 */
export class CallStaticPropertyNode extends CustomNode {
    /**
     * @constructs CallStaticPropertyNode
     * @param {CustomNode} node_to_call The node to call.
     * @param {Token} property_tok The token of the property to be called.
     */
    constructor(node_to_call, property_tok) {
        super();
        this.node_to_call = node_to_call;
        this.property_tok = property_tok;
        this.pos_start = this.node_to_call.pos_start;
        this.pos_end = this.property_tok.pos_end;
    }

    toString() {
        return `(prop ${this.node_to_call}::${this.property_tok.value})`;
    }
}

/**
 * @classdesc Describes the call to a method (`example.property.method()`)
 */
export class CallMethodNode extends CustomNode {
    /**
     * @constructs CallMethodNode
     * @param {CallNode} node_to_call The node to call.
     * @param {CustomNode} origin The token of the property to be called.
     */
    constructor(node_to_call, origin) {
        super();
        this.node_to_call = node_to_call;
        this.origin = origin;
        this.pos_start = this.origin.pos_start;
        this.pos_end = this.node_to_call.pos_end;
    }

    toString() {
        return `(method ${this.origin}.${this.node_to_call})`;
    }
}

/**
 * @classdesc Describes the declaration of a property in a class.
 */
export class ClassPropertyDefNode extends CustomNode {
    /**
     * @constructs ClassPropertyDefNode
     * @param {Token} property_name_tok The name of the variable.
     * @param {CustomNode} value_node The value of the variable.
     * @param {number} status 0 for private, 1 for public, 2 for protected.
     * @param {number} override 1 for override, 0 otherwise.
     * @param {number} static_prop 1 for static, 0 otherwise.
     */
    constructor(property_name_tok, value_node, status, override, static_prop) {
        super();
        this.property_name_tok = property_name_tok;
        this.value_node = value_node;
        this.status = status;
        this.override = override;
        this.static_prop = static_prop;
        this.pos_start = this.property_name_tok.pos_start;
        this.pos_end = this.value_node.pos_end;
    }

    toString() {
        switch (this.status) {
            case 0:
                return `(private ${this.override ? 'override' : ''} ${this.property_name_tok.value} = ${this.value_node})`;
            case 1:
                return `(public ${this.override ? 'override' : ''} ${this.property_name_tok.value} = ${this.value_node})`;
            case 2:
                return `(protected ${this.override ? 'override' : ''} ${this.property_name_tok.value} = ${this.value_node})`;
        }
    }
}

/**
 * @classdesc Describes the declaration of a function.
 */
export class ClassMethodDefNode extends CustomNode {
    /**
     * @constructs ClassMethodDefNode
     * @param {FuncDefNode} func The function itself.
     * @param {number} status 0 for private, 1 for public, 2 for protected.
     * @param {number} override 1 for override, 0 otherwise.
     * @param {number} static_prop 1 for static, 0 otherwise.
     */
    constructor(func, status, override, static_prop) {
        super();
        this.func = func;
        this.status = status;
        this.override = override;
        this.static_prop = static_prop;
        this.pos_start = this.func.pos_start;
        this.pos_end = this.func.pos_end;
    }

    toString() {
        switch (this.status) {
            case 0:
                return `(private ${this.override ? 'override' : ''} method ${this.func.var_name_tok.value})`;
            case 1:
                return `(public ${this.override ? 'override' : ''} method ${this.func.var_name_tok.value})`;
            case 2:
                return `(protected ${this.override ? 'override' : ''} method ${this.func.var_name_tok.value})`;
        }
    }
}

/**
 * @classdesc Describes the declaration of a class.
 */
export class ClassDefNode extends CustomNode {
    /**
     * @constructs ClassDefNode
     * @param {Token} class_name_tok The identifier that corresponds to the name of the class.
     * @param {Token|null} parent_class_tok The identifier that corresponds to the name of the parent class.
     * @param {Array<ClassPropertyDefNode>} properties All the properties of the class.
     * @param {Array<ClassMethodDefNode>} methods All the methods of the class.
     * @param {Array<ClassMethodDefNode>} getters All the getters of the class.
     * @param {Array<ClassMethodDefNode>} setters All the setters of the class.
     * @param {Position} pos_start The starting position of the declaration (first line).
     * @param {Position} pos_end The end position of the declaration (first line).
     */
    constructor(class_name_tok, parent_class_tok, properties, methods, getters, setters, pos_start, pos_end) {
        super();
        this.class_name_tok = class_name_tok;
        this.parent_class_tok = parent_class_tok;
        this.properties = properties;
        this.methods = methods;
        this.getters = getters;
        this.setters = setters;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `(Class ${this.class_name_tok.value})`;
    }
}

/**
 * @classdesc Describes the call to a class (new Class())
 */
export class ClassCallNode extends CustomNode {
    /**
     * @constructs ClassCallNode
     * @param {Token} class_name_tok The identifier that corresponds to the name of the class to be called.
     * @param {Array<CustomNode>} arg_nodes The list of arguments (for __init).
     */
    constructor(class_name_tok, arg_nodes) {
        super();
        this.class_name_tok = class_name_tok;
        this.arg_nodes = arg_nodes;

        this.pos_start = this.class_name_tok.pos_start;

        if (this.arg_nodes.length > 0) {
            this.pos_end = this.arg_nodes[this.arg_nodes.length - 1].pos_end;
        } else {
            this.pos_end = this.class_name_tok.pos_end;
        }
    }

    toString() {
        return `(new ${this.class_name_tok})`;
    }
}

/**
 * @classdesc Allows our program to modify the value of properties (`self.age = 17`)
 */
export class AssignPropertyNode extends CustomNode {
    /**
     * @constructs AssignPropertyNode
     * @param {CallPropertyNode} property The property to be modified.
     * @param {CustomNode} value_node The new value.
     */
    constructor(property, value_node) {
        super();
        this.property = property;
        this.value_node = value_node;
        this.pos_start = property.pos_start;
        this.pos_end = property.pos_end;
    }

    toString() {
        return `(${this.property} = ${this.value_node})`;
    }
}

/**
 * @classdesc Describes a call to the __init method of a class' parent.
 */
export class SuperNode extends CustomNode {
    /**
     * @constructs SuperNode
     * @param {Array<CustomNode>} arg_nodes The list of arguments.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(arg_nodes, pos_start, pos_end) {
        super();
        this.arg_nodes = arg_nodes;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `(super (${this.arg_nodes.length} args))`;
    }
}

/**
 * @classdesc Describes an argument inside the declaration of a function.
 */
export class ArgumentNode extends CustomNode {
    /**
     * @constructs ArgumentNode
     * @param {Token} arg_name_tok The name of the argument.
     * @param {boolean} is_rest Is a rest parameter?
     * @param {boolean} is_optional Is optional?
     * @param {CustomNode} default_value_node The default value in case the argument is optional.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(arg_name_tok, is_rest=false, is_optional=false, default_value_node=null, pos_start=null, pos_end=null) {
        super();
        this.arg_name_tok = arg_name_tok;
        this.is_rest = is_rest;
        this.is_optional = is_optional;
        this.default_value_node = default_value_node;
        this.pos_start = pos_start ? pos_start : this.arg_name_tok.pos_start;
        this.pos_end = pos_end;

        if (!this.pos_end) {
            if (this.default_value_node) {
                this.pos_end = this.default_value_node.pos_end;
            } else {
                this.pos_end = this.arg_name_tok.pos_end;
            }
        }
    }

    toString() {
        return `(${this.is_rest ? '...' : ''}${this.arg_name_tok.value}${this.is_optional ? '?' : ''}${this.default_value_node ? '=' + this.default_value_node : ''})`;
    }
}

/**
 * @classdesc Describes an Enum
 */
export class EnumNode extends CustomNode {
    /**
     * @constructs EnumNode
     * @param {Token} enum_name_tok The name of the enum
     * @param {Array<Token>} properties The names of the properties
     */
    constructor(enum_name_tok, properties, pos_start=null, pos_end=null) {
        super();
        this.enum_name_tok = enum_name_tok;
        this.properties = properties;
        this.pos_start = pos_start ? pos_start : this.enum_name_tok.pos_start;
        this.pos_end = pos_end ? pos_end : this.properties[this.properties.length - 1].pos_end;
    }
}

export class SwitchNode extends CustomNode {
    /**
     * @constructs SwitchNode
     * @param {CustomNode} primary_value The value being tested.
     * @param {Array<{conditions:Array<CustomNode>, body:CustomNode}>} cases The cases with their condition and statements.
     * @param {CustomNode|null} default_case The statements of the default case.
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(primary_value, cases, default_case, pos_start=null, pos_end=null) {
        super();
        this.primary_value = primary_value;
        this.cases = cases;
        this.default_case = default_case;
        
        this.pos_start = pos_start ? pos_start : this.primary_value.pos_start;
        this.pos_end = pos_end ? pos_end : (this.default_case ? this.default_case.pos_end : this.cases[this.cases.length - 1].body.pos_end);
    }

    toString() {
        return `(switch (${this.primary_value})(${this.cases.length + (this.default_case ? 1 : 0)} case${this.cases.length + (this.default_case ? 1 : 0) > 1 ? 's' : ''}))`;
    }
}

export class NoneNode extends CustomNode {
    /**
     * @constructs NoneNode
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(pos_start, pos_end) {
        super();
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `(none)`;
    }
}

export class BooleanNode extends CustomNode {
    /**
     * @constructs BooleanNode
     * @param {number} state true or false?
     * @param {string} display_name "true", "yes", "no" or "false"?
     * @param {Position} pos_start The starting position.
     * @param {Position} pos_end The end position.
     */
    constructor(state, display_name, pos_start, pos_end) {
        super();
        this.state = state;
        this.display_name = display_name;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    toString() {
        return `(${this.display_name})`;
    }
}