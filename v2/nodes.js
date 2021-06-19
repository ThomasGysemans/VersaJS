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