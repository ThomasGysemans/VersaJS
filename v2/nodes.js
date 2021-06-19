export class CustomNode {}

export class NumberNode extends CustomNode {
    /**
     * @constructs NumberNode
     * @param {number} value The value of that node.
     */
    constructor(value) {
        super();
        this.value = value;
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
    constructor(node_a, node_b) {
        super();
        this.node_a = node_a;
        this.node_b = node_b;
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
    }

    toString() {
        return `(${this.node_a}^${this.node_b})`;
    }
}