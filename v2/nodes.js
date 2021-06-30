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
        return `(${this.node_a}^${this.node_b})`;
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
        return `(${this.node_a}^${this.node_b})`;
    }
}

/**
 * @classdesc Creates a variable by saving its name and its value.
 */
export class VarAssignNode extends CustomNode {
    /**
     * @constructs VarAssignNode
     * @param {Token} var_name_tok The name of the variable.
     * @param {CustomNode} value_node The value of the variable. It might be an ElseAssignmentNode.
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
export class ElseAssignmentNode extends CustomNode {
    /**
     * @constructs ElseAssignmentNode
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
        return `(${this.node_a} == ${this.node_b})`;
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

export class ListAccessNode extends CustomNode {
    /**
     * @constructs ListAccessNode
     * @param {Token} var_name_tok The token that represents a variable.
     * @param {number} depth The depth of the array.
     * @param {Array<CustomNode>} list_nodes The expressions between the brackets.
     */
    constructor(var_name_tok, depth, list_nodes) {
        super();
        this.var_name_tok = var_name_tok;
        this.depth = depth;
        this.list_nodes = list_nodes;
        this.pos_start = var_name_tok.pos_start;
        this.pos_end = var_name_tok.pos_end;
    }

    toString() {
        return `(${this.var_name_tok.value}[...])`;
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
        return `(${this.accessor.var_name_tok.value}[...] = ${this.new_value_node})`;
    }
}

export class ListPushBracketsNode extends CustomNode {
    /**
     * @constructs ListPushBracketsNode
     * @param {Token} var_name_tok The access node of the list.
     */
    constructor(var_name_tok) {
        super();
        this.var_name_tok = var_name_tok;
        this.value = 0;
        this.pos_start = var_name_tok.pos_start;
        this.pos_end = var_name_tok.pos_end;
    }

    toString() {
        return `(${this.var_name_tok.value}[])`;
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
     */
    constructor(token) {
        super();
        this.token = token;
        this.pos_start = this.token.pos_start;
        this.pos_end = this.token.pos_end;
        this.interpretations = this.token.data;
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
     */
    constructor(cases, else_case) {
        super();
        this.cases = cases;
        this.else_case = else_case;

        this.pos_start = this.cases[0][0].pos_start;
        if (this.else_case.code) {
            this.pos_end = this.else_case.code.pos_end;
        } else {
            this.pos_end = this.cases[this.cases.length - 1][0].pos_end;
        }
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