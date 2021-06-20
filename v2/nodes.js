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
     * @param {CustomNode} value_node The value of the variable.
     */
    constructor(var_name_tok, value_node) {
        super();
        this.var_name_tok = var_name_tok;
        this.value_node = value_node;
        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.value_node.pos_end;
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